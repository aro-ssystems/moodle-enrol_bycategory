<?php
namespace enrol_bycategory\local;
use \core\hook\after_config;

class hook_callbacks {

    public static function before_headers_callback(after_config $hook): void {

        if (during_initial_install()) {
            return;
        }
        if (!get_config('enrol_bycategory', 'version')) {
            return;
        }

        if (defined('WS_SERVER') && WS_SERVER && isset($_POST['wsfunction'])) {

            switch ($_POST['wsfunction']) {
                case 'enrol_self_get_instance_info':
                    $_POST['wsfunction'] = 'enrol_bycategory_get_instance_info';
                    break;
                case 'enrol_self_enrol_user':
                    $_POST['wsfunction'] = 'enrol_bycategory_enrol_user';
                    break;
                default:
                    break;
            }
        }

    }
}