import pytest
from . import _hi

@pytest.fixture
def htmlillustrator():
    return _hi.HtmlIllustrator()

def test_hi_input(htmlillustrator):
    # Test hi_input with a simple prompt
    response = htmlillustrator.input("Enter your name:")
    assert isinstance(response, str)