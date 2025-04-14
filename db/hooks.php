<?php
$callbacks = [
    [
        'hook' => core\hook\after_config::class,
        'callback' => [\enrol_bycategory\local\hook_callbacks::class, 'before_headers_callback'],
        'priority' => 500,
    ],
];