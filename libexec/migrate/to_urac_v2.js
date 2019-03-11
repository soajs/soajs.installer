'use strict';
const fs = require("fs");
let Mongo = require("soajs").mongo;


function unpdateUsersAndGroups(mongoConnection, tenant, callback) {
    let condition = {$or: [{'tenant.code': "DEVE"}, {'tenant.code': "DEVO"}, {'tenant.code': "OWNE"}]};
    let s = {
        '$set': {
            'tenant': tenant
        }
    };
    mongoConnection.update("users", condition, s, {'multi': true}, (error) => {
        mongoConnection.update("groups", condition, s, {'multi': true}, (error) => {
            return callback();
        });
    });
}

function fixOwnerAndTenants(profile, tenant, callback) {
    //switch profile DBTN_urac
    profile.name = "DBTN_urac";

    let mongoConnection = new Mongo(profile);

    let condition = {username: "owner"};

    mongoConnection.find("users", condition, (error, ownerUser) => {
        if (error) {
            //close mongo connection
            mongoConnection.closeDb();
            return callback(error);
        }
        if (!ownerUser) {
            //close mongo connection
            mongoConnection.closeDb();
            return callback(null, 'Unable to migrate: Owner user record not found!');
        }
        if (ownerUser.length > 1) {
            //close mongo connection
            mongoConnection.closeDb();
            return callback(null, 'Unable to migrate: Many Owner user record found!');
        }
        ownerUser = ownerUser[0];

        ownerUser.tenant = {
            "id": tenant._id.toString(),
            "code": tenant.code
        };
        ownerUser.groups = ['owner'];
        mongoConnection.update("users", condition, ownerUser, (error) => {
            if (error) {
                //close mongo connection
                mongoConnection.closeDb();
                return callback(error);
            }
            condition = {code: "owner"};
            mongoConnection.find("groups", condition, (error, ownerGroup) => {
                if (error) {
                    //close mongo connection
                    mongoConnection.closeDb();
                    return callback(error);
                }
                if (!ownerGroup) {
                    //close mongo connection
                    mongoConnection.closeDb();
                    return callback(null, 'Unable to migrate: Owner group record not found!');
                }
                if (ownerGroup.length > 1) {
                    //close mongo connection
                    mongoConnection.closeDb();
                    return callback(null, 'Unable to migrate: Many Owner group record found!');
                }
                ownerGroup = ownerGroup[0];

                ownerGroup.tenant = {
                    "id": tenant._id.toString(),
                    "code": tenant.code
                };
                ownerGroup.config = {
                    "allowedPackages": {}
                };
                ownerGroup.config.allowedPackages[tenant.applications[0].product] = ["DSBRD_OWNER"];
                mongoConnection.update("groups", condition, ownerGroup, (error) => {
                    if (error) {
                        //close mongo connection
                        mongoConnection.closeDb();
                        return callback(error);
                    }

                    unpdateUsersAndGroups(mongoConnection, {
                        "id": tenant._id.toString(),
                        "code": tenant.code
                    }, () => {
                        //close mongo connection
                        mongoConnection.closeDb();
                        return callback(null, "MongoDb Soajs Data migrate!")

                    });
                });
            });

        });
    });
}

module.exports = (profilePath, dataPath, callback) => {
    let profile;
    //check if profile is found
    fs.stat(profilePath, (error) => {
        if (error) {
            return callback(null, 'Profile not found!');
        }

        //read  mongo profile file
        profile = require(profilePath);
        //use soajs.core.modules to create a connection to core_provision database
        let mongoConnectionTenant = new Mongo(profile);

        let condition = {code: "DBTN"};
        mongoConnectionTenant.find("tenants", condition, (error, tenant) => {
            if (error) {
                return callback(error);
            }
            if (!tenant) {
                //close mongo connection
                mongoConnectionTenant.closeDb();
                return callback(null, 'Unable to migrate: Tenant record not found!');
            }
            if (tenant.length > 1) {
                //close mongo connection
                mongoConnectionTenant.closeDb();
                return callback(null, 'Unable to migrate: Many Tenant record found!');
            }
            tenant = tenant[0];

            //Update tenant information
            tenant.name = "Console Tenant";
            tenant.description = "This is the tenant that holds the access rights and configuration for the console users with DSBRD_GUEST as Guest default package";
            tenant.tag = "Console";
            mongoConnectionTenant.update("tenants", condition, tenant, () => {
                //delete unneeded console tenants
                condition = {$or: [{code: "DEVE"}, {code: "DEVO"}, {code: "OWNE"}]};
                mongoConnectionTenant.remove("tenants", condition, () => {

                    //update product DSBRD
                    let record = require(dataPath + "products/dsbrd.js");
                    delete (record._id);
                    condition = {code: "DSBRD"};
                    mongoConnectionTenant.update("products", condition, record, {'upsert': true}, () => {
                        //close mongo connection
                        mongoConnectionTenant.closeDb();

                        fixOwnerAndTenants(profile, tenant, callback);
                    });
                });
            });
        });
    });
};