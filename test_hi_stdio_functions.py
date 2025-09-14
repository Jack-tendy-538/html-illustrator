import pytest
from . import _hi

@pytest.fixture
def htmlillustrator():
    hi = _hi.HtmlIllustrator()
    return hi

def test_hi_input(htmlillustrator):
    # Test hi_input with a simple prompt
    htmlillustrator.run()
    response = htmlillustrator.input("Enter your name:")
    assert isinstance(response, str)
    htmlillustrator.terminate()
