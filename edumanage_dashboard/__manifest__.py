# -*- coding: utf-8 -*-
{
    'name': 'EduManage - Dashboard',
    'version': '19.0.1.0.0',
    'category': 'Education',
    'summary': 'Premium School & Tuition Management — Command Centre Dashboard',
    'description': """
        EduManage Dashboard
        ====================
        A premium, modern dashboard — the daily command centre for school
        principals and tuition owners built on Odoo 19 Community.
    """,
    'author': 'EduManage',
    'website': 'https://www.edumanage.io',
    'license': 'LGPL-3',
    'depends': ['base', 'web', 'mail', 'edumanage_setup'],
    'data': [
        'security/ir.model.access.csv',
        'views/edumanage_dashboard_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'edumanage_dashboard/static/src/css/edumanage_dashboard.css',
            'edumanage_dashboard/static/src/js/edumanage_dashboard_template.xml',
            'edumanage_dashboard/static/src/js/edumanage_dashboard.js',
            'edumanage_dashboard/static/src/js/edumanage_router_patch.js',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
}
