# -*- coding: utf-8 -*-
{
    'name': 'EduManage - Institution Setup',
    'version': '19.0.1.0.0',
    'category': 'Education',
    'summary': 'Premium School & Tuition Management - Institution Onboarding',
    'description': """
        EduManage Institution Setup
        ============================
        A premium, modern onboarding experience for schools and tuition centres.
        Complete institution profile setup with a beautiful guided flow.
    """,
    'author': 'EduManage',
    'website': 'https://www.edumanage.io',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'web',
        'mail',
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/edumanage_setup_views.xml',
        'views/edumanage_menu.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'edumanage_setup/static/src/css/edumanage_setup.css',
            'edumanage_setup/static/src/js/edumanage_setup_template.xml',
            'edumanage_setup/static/src/js/edumanage_setup.js',
        ],
    },
    'images': ['static/description/banner.png'],
    'installable': True,
    'application': True,
    'auto_install': False,
}
