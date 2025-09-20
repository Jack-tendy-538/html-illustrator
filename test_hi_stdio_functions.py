import pytest
from . import _hi

@pytest.fixture
def hi():
    hi = _hi.HtmlIllustrator()
    return hi

def test_hi_input(hi):
    # Test hi_input with a simple prompt
    hi.run()
    response = hi.input("Enter your name:")
    assert isinstance(response, str)
    hi.kill()

def test_double_print(hi):
    hi.run()
    hi.print('Hello, pytest world!')
    hi.print('Hello, everyone')
    assert int(hi.input('How many hellos do you see?(use numeric number)')) == 2
    hi.kill()

def test_special_chars_in_prrints(hi):
    hi.run()
    hi.print('> x < !')
    hi.print('Do you see a bad face?[y/N]')
    result = hi.input('').lower()
    assert result == 'y'
    hi.kill()