import matplotlib.pyplot as plt
import numpy as np
import base64
from io import BytesIO

# Create a simple plot
def make_plot():
    fig, ax = plt.subplots(figsize=(8, 6))
    x = np.linspace(0, 10, 100)
    y = np.sin(x)
    ax.plot(x, y, 'b-', linewidth=2)
    ax.set_title('Test Plot')
    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    
    # Convert to base64
    buf = BytesIO()
    fig.savefig(buf, format='png')
    buf.seek(0)
    plot_b64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return plot_b64

# Create forge_result with plot
forge_result = {
    "metrics": {"test_metric": 0.95},
    "plots": {"test_plot": make_plot()},
    "controls": [],
    "explanation": "Test plot generation",
    "errors": []
}

print("Test plot created and added to forge_result")
