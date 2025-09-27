# setup.py
from setuptools import setup, find_packages

setup(
    name="htmlillustrator",
    version="1.0.0",
    packages=find_packages(),
    include_package_data=True,
    package_data={
        'htmlillustrator': [
            'templates/*.html',
            'static/*.js',
            'static/*.css'
        ]
    },
    install_requires=[
        'bottle>=0.12.0'
    ],
    author="Jack-tendy-538",
    author_email="jtnb508869677@outlook.com",
    description="A web-based console interface using Bottle",
    keywords="bottle web console html",
    url="https://github.com/Jack-tendy-538/Html-Illustrator",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
    ],
)