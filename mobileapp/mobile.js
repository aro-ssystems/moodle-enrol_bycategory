// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.


const getEnrolmentInfoCacheKey = (id) => {
    return 'PluginEnrolByCategory:' + id;
};

const getEnrolmentInfo = (id) => {
    const site = this.CoreSitesProvider.getCurrentSite();

    const params = {
        instanceid: id,
    };

    const preSets = {
        cacheKey: getEnrolmentInfoCacheKey(id),
    };

    return site.read('enrol_bycategory_get_instance_info', params, preSets);
};


const invalidateEnrolmentInfo = (id) => {
    const site = this.CoreSitesProvider.getCurrentSite();

    return site.invalidateWsCacheForKey(getEnrolmentInfoCacheKey(id));
};

const selfEnrol = async (courseId, password, instanceId, info) => {
    const site = this.CoreSitesProvider.getCurrentSite();

    const params = {
        courseid: courseId,
        password: password || '',
    };
    if (instanceId) {
        params.instanceid = instanceId;
    }

    return site.write('enrol_bycategory_enrol_user', params).then(response => {

        // let toast = Promise.resolve();
        // toast = this.CoreDomUtilsProvider.showToast(JSON.stringify(response), true, 2000);
        // await toast;
        if (response.status) {
            return true;
        }

        if (response.warnings && response.warnings.length) {
            // Invalid password warnings.
            const warning = response.warnings.find((warning) =>
                warning.warningcode == '2' || warning.warningcode == '3' || warning.warningcode == '4');

            if (warning) {
                throw new this.CoreWSError({ errorcode: this.CoreCoursesProvider.ENROL_INVALID_KEY, message: warning.message });
            } else {
                throw new this.CoreWSError(response.warnings[0]);
            }
        }

        throw Error('WS enrol_bycategory_enrol_user failed without warnings');
    });
};

const validatePassword = (method, info) => {

    return this.CoreDomUtilsProvider.showModalLoading('core.loading', true).then(modal => {
        const result = {
            password: info.password || '',
        };

        const waitlistActive = info.waitlist;

        if (waitlistActive) {


            let confirmWaitlist = Promise.resolve();

            confirmWaitlist = this.CoreDomUtilsProvider.showConfirm(
                    this.TranslateService.instant('plugin.enrol_bycategory.joinwaitlistmessage'),
                    this.TranslateService.instant('plugin.enrol_bycategory.waitlist'),
                    this.TranslateService.instant('plugin.enrol_bycategory.joinwaitlist'),
            );

            return confirmWaitlist.then(() => {
                // User confirmed to join waitlist.

                // let toast = Promise.resolve();
                // toast = this.CoreDomUtilsProvider.showToast(JSON.stringify('CONFIRMED'), true, 1000);
                // await toast;

                return selfEnrol(method.courseid, info.password, method.id, info).then(enroled => {

                // let toast = Promise.resolve();
                // toast = this.CoreDomUtilsProvider.showToast(JSON.stringify('RESULT'), true, 1500);
                // await toast;
                // let toast2 = Promise.resolve();
                // toast2 = this.CoreDomUtilsProvider.showToast(JSON.stringify('enroled'), true, 1500);
                // toast2.then(() => {

                result.validated = enroled;
                return result;
                // });

                }).catch(async error => {
                    if (error && error.errorcode === this.CoreCoursesProvider.ENROL_INVALID_KEY) {
                        result.validated = false;
                        result.error = error.message;

                        return result;
                    }

                    this.CoreDomUtilsProvider.showErrorModalDefault(error, 'plugin.enrol_bycategory.errorselfenrol', true);

                    throw error;
                }).finally(() => {
                    modal.dismiss();
                });

            }).catch((error) => {
                // User canceled waitlist.
                let alert = Promise.resolve();
                alert = this.CoreDomUtilsProvider.showAlert('NOT IMPLEMENTED', 'YOU CANCELED BUT THIS FUNCTION IS NOT IMPLEMENTED YET');

                alert.then(() => {
                    result.validated = false;
                    modal.dismiss();
                    return result;
                });
            });

                // let alert = Promise.resolve();
                // alert = this.CoreDomUtilsProvider.showAlert('NOT IMPLEMENTED', 'THIS FUNCTION IS NOT IMPLEMENTED YET');

                // alert.then(() => {
                //     result.validated = false;
                //     return result;
                // });


        } else {
           return selfEnrol(method.courseid, info.password, method.id, info).then(enroled => {

                // let toast = Promise.resolve();
                // toast = this.CoreDomUtilsProvider.showToast('ENROLED:' + JSON.stringify({enroled: enroled}), true, 15000);
                // // await toast;
                // toast.then(() => {

                result.validated = enroled;

                return result;
                // });
            }).catch(async error => {
                if (error && error.errorcode === this.CoreCoursesProvider.ENROL_INVALID_KEY) {
                    result.validated = false;
                    result.error = error.message;

                    // let toast = Promise.resolve();
                    // toast = this.CoreDomUtilsProvider.showToast('RESULT ERROR:' + JSON.stringify(result), true, 10000);
                    // await toast;

                    return result;
                }

                this.CoreDomUtilsProvider.showErrorModalDefault(error, 'plugin.enrol_bycategory.errorselfenrol', true);

                throw error;
            }).finally(() => {
                modal.dismiss();
            });
        }
    });
};

const performEnrol = (method, info) => {
    // Try to enrol without password.
    return validatePassword(method, info).then(response => {

        let toast = Promise.resolve();
        toast = this.CoreDomUtilsProvider.showToast("RESPONSE:" + JSON.stringify(response), true, 2000);
        return toast.then(() => {
            if (response.validated) {
                return true;
            }
        // Ask for password.
        this.CoreDomUtilsProvider.promptPassword({
            title: method.name,
            validator: (password) => validatePassword(method, password),
            placeholder: 'plugin.enrol_bycategory.password',
            submit: 'core.courses.enrolme',
        }).then(response => {
            return response.validated;
        });

        });

        // // Ask for password.
        // this.CoreDomUtilsProvider.promptPassword({
        //     title: method.name,
        //     validator: (password) => validatePassword(method, password),
        //     placeholder: 'plugin.enrol_bycategory.password',
        //     submit: 'core.courses.enrolme',
        // }).then(response => {
        //     return response.validated;
        // });
    }).catch(() => {
        return false;
    });
};

var result = {

    // enrolmentAction: 'guest',

    getEnrolmentAction: async (methodType) => {

        let toast = Promise.resolve();

        toast = this.CoreDomUtilsProvider.showToast('GET ENROLMENT ACTION', true, 2000);

        await toast;

        const handler = this.getHandler(methodType, false);
        if (!handler) {
            return CoreEnrolAction.NOT_SUPPORTED;
        }

        return handler.enrolmentAction;
    },

    isEnrolSupported: async (methodType) => {

        let toast = Promise.resolve();

        toast = this.CoreDomUtilsProvider.showToast('IS ENROL SUPPORTED', true, 2000);

        await toast;

        return this.hasHandler(methodType, true);
    },

    canAccess: async (method) => {

    let toast = Promise.resolve();

    toast = this.CoreDomUtilsProvider.showToast('CAN ACCESS FUNCTION', true, 2000);

    return toast.then(() => {
        return { canAccess: true };
    });

    },
    componentInit: () => {
     let toast = Promise.resolve();

    toast = this.CoreDomUtilsProvider.showToast('COMPONENT INIT', true, 1000);

    return toast.then(() => {
        return true;
    });
    },
    validateAccess: async (method) => {
    let toast = Promise.resolve();
    toast = this.CoreDomUtilsProvider.showToast('VALIDATING ACCESS', true, 2000);
    await toast;

    return false;

    },
    getInfoIcons: async (courseId) => {

        // let toast = Promise.resolve();
        // toast = this.CoreDomUtilsProvider.showToast('GET INFO ICONS TOAST', true, 2000);
        // await toast;

        // const icons = [];

        //             icons.push({
        //                 label: 'addon.enrol_bycategory.pluginname',
        //                 icon: 'fas-right-to-bracket',
        //             });

        //         return icons;

        // let enrol = Promise.resolve();

        // enrol = this.CoreEnrolService.getCourseEnrolmentMethods(courseId);

        // enrol.then(async enrolments => {
        //     // let toast = Promise.resolve();
        //     // toast = this.CoreDomUtilsProvider.showToast(JSON.stringify(enrolments), true, 2000);
        //     // await toast;

        //     const bycategoryEnrolments = enrolments.filter(enrolment => enrolment.type === 'bycategory');

        //     if (bycategoryEnrolments.length > 0) {
        //         const firstBycategoryEnrolment = bycategoryEnrolments[0];

        //         if (firstBycategoryEnrolment.status === this.TranslateService.instant('plugin.enrol_bycategory.maxenrolledreached')) {
        //                 return getEnrolmentInfo(firstBycategoryEnrolment.id).then(async info => {
        //                 // let toast = Promise.resolve();
        //                 // toast = this.CoreDomUtilsProvider.showToast(JSON.stringify(info), true, 5000);
        //                 // await toast;
        //         const icons = [];
        //         if (!info.enrolpassword) {
        //             icons.push({
        //                 label: 'addon.enrol_bycategory.pluginname',
        //                 icon: 'fas-right-to-bracket',
        //             });
        //         } else {
        //             icons.push({
        //                 label: 'addon.enrol_bycategory.pluginname',
        //                 icon: 'fas-key',
        //             });
        //         }

        //         return icons;


                        // if (!info.enrolpassword) {
                        //     return [{
                        //         label: 'plugin.enrol_bycategory.pluginname',
                        //         icon: 'fas-right-to-bracket',
                        //     }];
                        // } else {
                        //     return [{
                        //         label: 'plugin.enrol_bycategory.pluginname',
                        //         icon: 'fas-key',
                        //     }];
                        // }
            //         });
            //     }
            // }

        // });

        return this.CoreEnrolService.getSupportedCourseEnrolmentMethods(courseId, 'bycategory').then(async enrolments => {
            // let toast = Promise.resolve();
            // toast = this.CoreDomUtilsProvider.showToast(JSON.stringify(enrolments), true, 2000);
            // await toast;
            if (!enrolments.length) {
                return [];
            }

            return getEnrolmentInfo(enrolments[0].id).then(info => {


                if (!info.enrolpassword) {
                    return [{
                        label: 'plugin.enrol_bycategory.pluginname',
                        icon: 'fas-right-to-bracket',
                    }];
                } else {
                    return [{
                        label: 'plugin.enrol_bycategory.pluginname',
                        icon: 'fas-key',
                    }];
                }
            });
        });
    },
    enrol: (method) => {
        return getEnrolmentInfo(method.id).then(info => {
            let promise = Promise.resolve();

            // check waitlist status here

            // info.waitlist = true;

            let waitlistActive = info.waitlist;

            let userWaitlistStatus = info.userwaitliststatus;
            // waitlistActive = true;
            // info.waitlist = waitlistActive;
            // let toast = Promise.resolve();
            // toast = this.CoreDomUtilsProvider.showToast(JSON.stringify(waitlistActive), true, 1000);
            // toast.then(() => {

            // })


            let message = this.TranslateService.instant('plugin.enrol_bycategory.confirmselfenrol') + '<br>' +
                    this.TranslateService.instant('plugin.enrol_bycategory.nopassword');

            if (userWaitlistStatus) {
            let toast = Promise.resolve();
            toast = this.CoreDomUtilsProvider.showToast(JSON.stringify('User is on waitlist'), true, 1000);
            toast.then(() => {

            })
            }

            if (waitlistActive) {
                message += '<br>' + this.TranslateService.instant('plugin.enrol_bycategory.waitlistmessage');
            }

            if (!info.enrolpassword) {
                promise = this.CoreDomUtilsProvider.showConfirm(
                    message,
                    method.name,
                );
            }

            return promise.then(() => {

                // TODO check response for waitlist here
                return performEnrol(method, info);
            }).catch(() => {
                return false;
            });
        });
    },
    invalidate: async(method) => {

                    let toast = Promise.resolve();

            toast = this.CoreDomUtilsProvider.showToast('IS ENROL SUPPORTED', true, 2000);


            await toast;
        return invalidateEnrolmentInfo(method.id);
    },
};

result;