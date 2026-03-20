"""
Test script for the robust plot detection system
This demonstrates various plotting patterns that the system should handle
"""

# Test 1: Manual forge_result with make_plot function
import matplotlib.pyplot as plt
import numpy as np
import base64
from io import BytesIO

def make_plot():
    """Create a plot and return it as base64"""
    fig, ax = plt.subplots(figsize=(8, 6))
    x = np.linspace(0, 10, 100)
    y = np.sin(x)
    ax.plot(x, y, 'b-', linewidth=2, label='sin(x)')
    ax.set_xlabel('X values')
    ax.set_ylabel('Y values')
    ax.set_title('Test Plot - make_plot function')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    buf = BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=150)
    buf.seek(0)
    plot_b64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return plot_b64

# Create forge_result manually
forge_result = {
    "metrics": {"accuracy": 0.95, "r_squared": 0.87},
    "plots": {"main_plot": make_plot()},
    "controls": [],
    "explanation": "This test demonstrates manual forge_result creation with make_plot function",
    "errors": []
}

print("Test 1: Manual forge_result with make_plot function - COMPLETED")

# Test 2: Direct matplotlib without forge_result (should auto-capture)
import matplotlib.pyplot as plt2
import numpy as np2

fig2, ax2 = plt2.subplots(figsize=(8, 6))
x2 = np2.linspace(0, 5, 50)
y2 = x2**2
ax2.plot(x2, y2, 'r-', linewidth=2, label='x^2')
ax2.set_xlabel('X values')
ax2.set_ylabel('Y values')
ax2.set_title('Test Plot 2 - Direct matplotlib')
ax2.legend()
ax2.grid(True, alpha=0.3)

# Note: NOT calling plt.show() - system should auto-capture this
print("Test 2: Direct matplotlib without forge_result - COMPLETED")

# Test 3: make_plot function defined but not called (should auto-call)
def make_untouched_plot():
    """This function is defined but not called - system should detect and call it"""
    fig, ax = plt.subplots(figsize=(8, 6))
    x = np.linspace(-5, 5, 100)
    y = np.cos(x)
    ax.plot(x, y, 'g-', linewidth=2, label='cos(x)')
    ax.set_xlabel('X values')
    ax.set_ylabel('Y values')
    ax.set_title('Test Plot 3 - Auto-called make_plot')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    buf = BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=150)
    buf.seek(0)
    plot_b64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return plot_b64

# Note: NOT calling make_untouched_plot() - system should auto-detect and call it
print("Test 3: make_plot function defined but not called - COMPLETED")

# Test 4: Empty forge_result with plots dict (should auto-fill)
forge_result_empty = {
    "metrics": {"test": 1.0},
    "plots": {},  # Empty plots dict - system should detect and fill
    "controls": [],
    "explanation": "Empty forge_result - system should auto-fill plots",
    "errors": []
}

print("Test 4: Empty forge_result with plots dict - COMPLETED")

print("All tests completed! The smart detection system should:")
print("1. Extract plot from manual forge_result")
print("2. Auto-capture direct matplotlib figures")
print("3. Auto-call make_plot functions that weren't called")
print("4. Auto-fill empty forge_result plots dict")
