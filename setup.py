# -*- coding: utf-8 -*-
from setuptools import setup, find_packages

with open('requirements.txt') as f:
	install_requires = f.read().strip().split('\n')

# get version from __version__ variable in journeys/__init__.py
from journeys import __version__ as version

setup(
	name='journeys',
	version=version,
	description='App to Show Usages Information and setting limits for user',
	author='OneHash Inc',
	author_email='support@onehash.ai',
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
