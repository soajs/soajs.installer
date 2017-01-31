'use strict';
var gConfig = require("../../config.js");

var components = {
	service: {
		"apiVersion": "v1",
		"kind": "Service",
		"metadata": {
			"name": "dashboard-nginx-service",
			"labels": {
				"soajs.content": "true",
				"soajs.env.code": "dashboard",

                "soajs.service.name": "nginx",
                "soajs.service.group": "nginx",
				"soajs.service.type": "nginx",
				"soajs.service.label": "dashboard-nginx"
			}
		},
		"spec": {
			"type": "NodePort",
			"selector": {
				"soajs.service.label": "dashboard-nginx"
			},
			"ports": [
				{
					"protocol": "TCP",
					"port": 80,
					"targetPort": 80,
					"nodePort": (30000 + gConfig.nginx.port.http)
				}
			]
		}
	},
	deployment: {
		"apiVersion": "extensions/v1beta1",
		"kind": "Deployment",
		"metadata": {
			"name": "dashboard-nginx",
			"labels": {
				"soajs.content": "true",
				"soajs.env.code": "dashboard",

                "soajs.service.name": "nginx",
                "soajs.service.group": "nginx",
				"soajs.service.type": "nginx",
				"soajs.service.label": "dashboard-nginx"
			}
		},
		"spec": {
			"replicas": gConfig.kubernetes.replicas,
			"selector": {
				"matchLabels": {
					"soajs.service.label": "dashboard-nginx"
				}
			},
			"template": {
				"metadata": {
					"name": "dashboard-nginx",
					"labels": {
						"soajs.content": "true",
						"soajs.env.code": "dashboard",

		                "soajs.service.name": "nginx",
		                "soajs.service.group": "nginx",
						"soajs.service.type": "nginx",
						"soajs.service.label": "dashboard-nginx"
					}
				},
				"spec": {
					"containers": [
						{
							"name": "dashboard-nginx",
							"image": gConfig.imagePrefix + "/nginx",
							"imagePullPolicy": "IfNotPresent",
							"workingDir": "/opt/soajs/FILES/deployer/",
							"command": ["./soajsDeployer.sh"],
							"args": ["-T", "nginx", "-X", "deploy"],
							"ports": [
								{
									"containerPort": gConfig.nginx.port.http
								}
							],
							"env": [
								{
									"name": "SOAJS_ENV",
									"value": "dashboard"
								},
								{
									"name": "SOAJS_GIT_DASHBOARD_BRANCH",
									"value": gConfig.git.branch
								},
								{
									"name": "SOAJS_NX_API_DOMAIN",
									"value": gConfig.apiPrefix + "." + gConfig.masterDomain
								},
								{
									"name": "SOAJS_NX_SITE_DOMAIN",
									"value": gConfig.sitePrefix + "." + gConfig.masterDomain
								},
								{
									"name": "SOAJS_NX_CONTROLLER_NB",
									"value": "" + gConfig.kubernetes.replicas
								},
								{
									"name": "SOAJS_NX_CONTROLLER_IP_1",
									"value": "dashboard-controller-service"
								},
								{
									"name": "SOAJS_NX_CONTROLLER_PORT_1",
									"value": "4000"
								},
								{
                                    "name": "SOAJS_DEPLOY_HA",
                                    "value": "kubernetes"
                                },
                                {
                                    "name": "SOAJS_HA_IP",
                                    "valueFrom": {
                                        "fieldRef": {
                                            "fieldPath": "status.podIP"
                                        }
                                    }
                                },
                                {
                                    "name": "SOAJS_HA_NAME",
                                    "valueFrom": {
                                        "fieldRef": {
                                            "fieldPath": "metadata.name"
                                        }
                                    }
                                }
							],
                            "volumeMounts": [
                                {
                                    "mountPath": gConfig.kubernetes.volumes.log.path,
                                    "name": gConfig.kubernetes.volumes.log.label
                                }
                            ]
						}
					],
                    "volumes": [
                        {
                            "name": gConfig.kubernetes.volumes.log.label,
                            "hostPath": {
                                "path": gConfig.kubernetes.volumes.log.path
                            }
                        }
                    ]
				}
			}
		}
	}
};

module.exports = components;
