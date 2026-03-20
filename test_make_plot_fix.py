import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import base64
from io import BytesIO

matplotlib.use('Agg')
sns.set_theme(style="dark", palette="muted")

# Create sample data
np.random.seed(0)
X = np.random.rand(100, 1)
y = 3 + 2 * X + np.random.randn(100, 1) / 1.5
linear_regression_data = pd.DataFrame(np.hstack((X, y)), columns=['X', 'y'])

# Define make_plot function outside try block
def make_plot():
    fig, ax = plt.subplots(figsize=(8, 6), facecolor='#0a0a0a')
    ax.set_facecolor('#0a0a0a')
    ax.tick_params(colors='#888888', labelsize=8)
    for spine in ax.spines.values(): 
        spine.set_color('#333333')
    ax.title.set_color('#ffffff')
    ax.xaxis.label.set_color('#888888')
    ax.yaxis.label.set_color('#888888')
    sns.scatterplot(data=linear_regression_data, x='X', y='y', ax=ax)
    
    # Add a simple line
    x_vals = linear_regression_data['X']
    y_vals = 2 * x_vals + 3  # Simple linear relationship
    ax.plot(x_vals, y_vals, color='red', linewidth=2)
    
    plt.close(fig)
    buf = BytesIO()
    fig.savefig(buf, format='png')
    return base64.b64encode(buf.getvalue()).decode('utf-8')

# Test the smart detection system
try:
    # Simulate some processing
    LEARNING_RATE = 0.05
    NUM_ITERATIONS = 500
    
    # Train model
    X_vals = linear_regression_data['X'].values.reshape(-1, 1)
    y_vals = linear_regression_data['y'].values.reshape(-1, 1)
    theta = np.zeros((1, 1))
    for _ in range(NUM_ITERATIONS):
        predictions = np.dot(X_vals, theta)
        gradient = np.dot(X_vals.T, (predictions - y_vals)) / len(X_vals)
        theta -= LEARNING_RATE * gradient
    
    # Create forge_result
    predictions = np.dot(X_vals, theta)
    accuracy = 1 - np.mean(np.abs(predictions - y_vals)) / np.mean(np.abs(y_vals - np.mean(y_vals)))
    
    forge_result = {
        "metrics": {"Accuracy": float(accuracy)},
        "plots": {"main_plot": make_plot()},  # This should work now
        "controls": [],
        "explanation": "Linear regression with plot generation",
        "errors": []
    }
    
    print("✅ Test completed successfully!")
    print(f"✅ forge_result created with {len(forge_result['plots'])} plots")
    print(f"✅ Plot data length: {len(forge_result['plots']['main_plot'])}")
    
except Exception as e:
    forge_result = {
        "metrics": {},
        "plots": {},
        "controls": [],
        "explanation": "",
        "errors": [str(e)]
    }
    print(f"❌ Error: {e}")
