import pytest
import threading
import time
from . import _hi

@pytest.fixture
def hi():
    hi = _hi.HtmlIllustrator()
    yield hi
    try:
        hi.kill()
    except Exception:
        pass

def _inject_input(hi, value, timeout=2.0):
    """�ȴ������ __annotations__ �д��� input_waiter��Ȼ��ע��ֵ�������¼���"""
    start = time.time()
    while True:
        if 'input_waiter' in hi.__annotations__:
            iw = hi.__annotations__.pop('input_waiter')
            iw.value = value
            iw.event.set()
            return
        if time.time() - start > timeout:
            raise TimeoutError("Timed out waiting for input_waiter")
        time.sleep(0.01)

def test_hi_input(hi):
    # �������񵫲����������ʹ����ʱ�˿��Ա���˿ڳ�ͻ
    hi.run(host='localhost', port=0, open_browser=False)
    t = threading.Thread(target=_inject_input, args=(hi, "Alice"))
    t.start()
    response = hi.input("Enter your name:")
    t.join(timeout=1)
    assert isinstance(response, str)
    assert response == "Alice"

def test_double_print(hi):
    hi.run(host='localhost', port=0, open_browser=False)
    hi.print('Hello, pytest world!')
    hi.print('Hello, everyone')
    t = threading.Thread(target=_inject_input, args=(hi, "2"))
    t.start()
    response = hi.input('How many hellos do you see?(use numeric number)')
    t.join(timeout=1)
    assert int(response) == 2

def test_special_chars_in_prrints(hi):
    hi.run(host='localhost', port=0, open_browser=False)
    hi.print('> x < !')
    hi.print('Do you see a bad face?[y/N]')
    t = threading.Thread(target=_inject_input, args=(hi, "y"))
    t.start()
    result = hi.input('').lower()
    t.join(timeout=1)
    assert result == 'y'