"""
Robust Plot Detection and Execution System
Automatically detects plotting patterns and executes them intelligently
"""

import sys
import io
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from io import BytesIO

class SmartPlotDetector:
    def __init__(self):
        self.detected_patterns = []
        self.execution_plan = []
        
    def analyze_code(self, code):
        """Analyze code to detect plotting patterns - more comprehensive detection"""
        lines = code.split('\n')
        
        # Pattern 1: Manual forge_result creation
        if 'forge_result' in code and 'plots' in code:
            self.detected_patterns.append('manual_forge_result')
            
        # Pattern 2: Direct matplotlib calls
        if any(call in code for call in ['plt.figure(', 'plt.plot(', 'plt.scatter(', 'plt.hist(', 'plt.subplot(', 'plt.subplots(']):
            self.detected_patterns.append('direct_matplotlib')
            
        # Pattern 3: Seaborn usage
        if 'sns.' in code or 'seaborn' in code.lower():
            self.detected_patterns.append('seaborn_usage')
            
        # Pattern 4: make_plot function
        if 'def make_plot(' in code:
            self.detected_patterns.append('make_plot_function')
            
        # Pattern 5: Plot creation without display
        has_plot_creation = any(pattern in code for pattern in [
            'plt.figure(', 'plt.subplots(', 'fig, ax =', 'fig = plt'
        ])
        has_no_show = 'plt.show()' not in code and 'plt.show' not in code
        
        if has_plot_creation and has_no_show:
            self.detected_patterns.append('undisplayed_plots')
            
        # Pattern 6: Explicit show call
        if 'plt.show()' in code:
            self.detected_patterns.append('explicit_show')
            
        # Pattern 7: More aggressive matplotlib usage detection
        if 'plt.' in code and 'import matplotlib' in code:
            self.detected_patterns.append('matplotlib_usage')
            
        return self.detected_patterns
    
    def create_execution_plan(self, code, global_vars):
        """Create smart execution plan based on detected patterns"""
        plan = {
            'auto_capture': True,
            'force_execution': False,
            'inject_code': [],
            'post_process': []
        }
        
        # If manual forge_result detected, prioritize it
        if 'manual_forge_result' in self.detected_patterns:
            plan['auto_capture'] = True
            plan['post_process'].append('extract_forge_result_plots')
            
        # If direct matplotlib without show, force auto-capture
        if 'undisplayed_plots' in self.detected_patterns:
            plan['auto_capture'] = True
            plan['force_execution'] = True
            
        # If make_plot function exists but not called, call it
        if 'make_plot_function' in self.detected_patterns:
            if 'make_plot()' not in code:
                plan['inject_code'].append('# Auto-calling make_plot function')
                plan['inject_code'].append('from smart_plot_detector import find_and_call_make_plot')
                plan['inject_code'].append('plot_result = find_and_call_make_plot(globals())')
                plan['inject_code'].append('if plot_result:')
                plan['inject_code'].append('    print(f"make_plot() auto-executed: {type(plot_result)}")')
                plan['inject_code'].append('else:')
                plan['inject_code'].append('    print("make_plot() auto-execution failed")')
                
        # If no forge_result but plots exist, create one
        if 'forge_result' not in code and ('direct_matplotlib' in self.detected_patterns or 'seaborn_usage' in self.detected_patterns):
            plan['post_process'].append('auto_create_forge_result')
            
        return plan

def smart_execute_code(code, global_vars):
    """Intelligently execute code with plot detection and auto-capture - ALWAYS ensure dynamic plots"""
    detector = SmartPlotDetector()
    patterns = detector.analyze_code(code)
    plan = detector.create_execution_plan(code, global_vars)
    
    print(f"[SMART DETECTOR] Found patterns: {patterns}")
    print(f"[SMART DETECTOR] Execution plan: {plan}")
    
    # Inject smart code if needed
    modified_code = code
    if plan['inject_code']:
        modified_code += '\n\n# SMART EXECUTION INJECTIONS\n'
        modified_code += '\n'.join(plan['inject_code'])
    
    # Execute the code
    try:
        exec(modified_code, global_vars)
        print("[SMART EXECUTOR] Code executed successfully")
    except Exception as e:
        print(f"[SMART EXECUTOR] Execution error: {e}")
        raise
    
    # ALWAYS try to call make_plot if it exists - this ensures dynamic plots
    plot_result = find_and_call_make_plot(global_vars)
    if plot_result:
        print("[SMART EXECUTOR] Successfully called make_plot for dynamic plot")
        
        # If forge_result exists, update it; if not, create it
        if 'forge_result' in global_vars:
            forge_result = global_vars['forge_result']
            if isinstance(forge_result, dict):
                if 'plots' not in forge_result:
                    forge_result['plots'] = {}
                forge_result['plots']['dynamic_plot'] = plot_result
                print("[SMART EXECUTOR] Updated existing forge_result with dynamic plot")
            else:
                # Replace non-dict forge_result
                global_vars['forge_result'] = {
                    'plots': {'dynamic_plot': plot_result},
                    'metrics': {},
                    'controls': [],
                    'explanation': 'Dynamic plot automatically generated',
                    'errors': []
                }
        else:
            # Create new forge_result with the dynamic plot
            global_vars['forge_result'] = {
                'plots': {'dynamic_plot': plot_result},
                'metrics': {},
                'controls': [],
                'explanation': 'Dynamic plot automatically generated',
                'errors': []
            }
            print("[SMART EXECUTOR] Created new forge_result with dynamic plot")
    else:
        print("[SMART EXECUTOR] No make_plot function found or failed to call")
        
        # Fallback: try to capture matplotlib figures directly
        if 'forge_result' in global_vars:
            forge_result = global_vars['forge_result']
            if isinstance(forge_result, dict) and 'plots' in forge_result:
                plots_dict = forge_result['plots']
                if isinstance(plots_dict, dict) and len(plots_dict) == 0:
                    print("[SMART EXECUTOR] Empty plots dict - attempting matplotlib capture")
                    try:
                        # Get all current figures
                        figures = [plt.figure(i) for i in plt.get_fignums()]
                        if figures:
                            plots = {}
                            for i, fig in enumerate(figures):
                                buf = BytesIO()
                                fig.savefig(buf, format='png', bbox_inches='tight', dpi=150)
                                buf.seek(0)
                                plot_b64 = base64.b64encode(buf.read()).decode('utf-8')
                                plots[f'auto_capture_{i+1}'] = plot_b64
                                plt.close(fig)
                                print(f"[SMART EXECUTOR] Auto-captured figure {i+1}")
                            
                            forge_result['plots'] = plots
                            print(f"[SMART EXECUTOR] Added {len(plots)} auto-captured plots")
                        else:
                            print("[SMART EXECUTOR] No matplotlib figures found to capture")
                    except Exception as e:
                        print(f"[SMART EXECUTOR] Auto-capture failed: {e}")
        
        # If still no forge_result, create one with any available plots
        elif 'direct_matplotlib' in patterns or 'matplotlib_usage' in patterns:
            print("[SMART EXECUTOR] Creating forge_result from matplotlib patterns")
            try:
                figures = [plt.figure(i) for i in plt.get_fignums()]
                if figures:
                    plots = {}
                    for i, fig in enumerate(figures):
                        buf = BytesIO()
                        fig.savefig(buf, format='png', bbox_inches='tight', dpi=150)
                        buf.seek(0)
                        plot_b64 = base64.b64encode(buf.read()).decode('utf-8')
                        plots[f'matplotlib_plot_{i+1}'] = plot_b64
                        plt.close(fig)
                    
                    global_vars['forge_result'] = {
                        'plots': plots,
                        'metrics': {},
                        'controls': [],
                        'explanation': 'Auto-captured matplotlib plots',
                        'errors': []
                    }
                    print(f"[SMART EXECUTOR] Created forge_result with {len(plots)} matplotlib plots")
            except Exception as e:
                print(f"[SMART EXECUTOR] Matplotlib capture failed: {e}")
    
    # Post-processing - ALWAYS run post-processing to handle existing forge_result
    if 'extract_forge_result_plots' in plan['post_process']:
        extract_forge_result_plots(global_vars)
        
    if 'auto_create_forge_result' in plan['post_process']:
        auto_create_forge_result(global_vars)

def extract_forge_result_plots(global_vars):
    """Extract plots from existing forge_result"""
    if 'forge_result' in global_vars and isinstance(global_vars['forge_result'], dict):
        plots_dict = global_vars['forge_result'].get('plots', {})
        print(f"[EXTRACTOR] Found {len(plots_dict)} plots in forge_result")
        
        for plot_name, plot_data in plots_dict.items():
            print(f"[EXTRACTOR] Plot {plot_name}: {type(plot_data)}, length={len(plot_data) if plot_data else 0}")

def auto_create_forge_result(global_vars):
    """Automatically create forge_result from matplotlib figures"""
    print("[AUTO CREATOR] Creating forge_result from matplotlib figures")
    
    # Get all current figures
    figures = [plt.figure(i) for i in plt.get_fignums()]
    
    if not figures:
        print("[AUTO CREATOR] No matplotlib figures found")
        return
    
    plots = {}
    for i, fig in enumerate(figures):
        try:
            buf = BytesIO()
            fig.savefig(buf, format='png', bbox_inches='tight', dpi=150)
            buf.seek(0)
            plot_b64 = base64.b64encode(buf.read()).decode('utf-8')
            plots[f'auto_plot_{i+1}'] = plot_b64
            plt.close(fig)
            print(f"[AUTO CREATOR] Captured auto_plot_{i+1}")
        except Exception as e:
            print(f"[AUTO CREATOR] Error capturing figure {i}: {e}")
    
    # Create forge_result if it doesn't exist
    if 'forge_result' not in global_vars:
        global_vars['forge_result'] = {}
    
    # Update forge_result with plots
    if not isinstance(global_vars['forge_result'], dict):
        global_vars['forge_result'] = {}
    
    global_vars['forge_result']['plots'] = plots
    global_vars['forge_result']['metrics'] = global_vars['forge_result'].get('metrics', {})
    global_vars['forge_result']['controls'] = global_vars['forge_result'].get('controls', [])
    global_vars['forge_result']['explanation'] = global_vars['forge_result'].get('explanation', 'Auto-generated plots')
    global_vars['forge_result']['errors'] = global_vars['forge_result'].get('errors', [])
    
    print(f"[AUTO CREATOR] Created forge_result with {len(plots)} plots")

def find_and_call_make_plot(global_vars):
    """Find make_plot function in globals or locals and call it"""
    print("[SMART DETECTOR] Looking for make_plot function...")
    
    # Check globals first
    if 'make_plot' in global_vars and callable(global_vars['make_plot']):
        print("[SMART DETECTOR] Found make_plot in globals")
        try:
            result = global_vars['make_plot']()
            print(f"[SMART DETECTOR] Successfully called make_plot from globals: {type(result)}")
            return result
        except Exception as e:
            print(f"[SMART DETECTOR] Failed to call make_plot from globals: {e}")
    
    # Check locals by inspecting frames
    try:
        import sys
        for frame_info in sys._current_frames().values():
            if hasattr(frame_info, 'f_locals') and 'make_plot' in frame_info.f_locals:
                print("[SMART DETECTOR] Found make_plot in frame locals")
                try:
                    result = frame_info.f_locals['make_plot']()
                    print(f"[SMART DETECTOR] Successfully called make_plot from locals: {type(result)}")
                    return result
                except Exception as e:
                    print(f"[SMART DETECTOR] Failed to call make_plot from locals: {e}")
    except Exception as e:
        print(f"[SMART DETECTOR] Failed to inspect frames: {e}")
    
    print("[SMART DETECTOR] make_plot function not found or not callable")
    return None

# Main smart execution function
def execute_with_smart_detection(code, global_vars=None):
    """Main entry point for smart plot detection and execution"""
    if global_vars is None:
        global_vars = {}
    
    print("[SMART SYSTEM] Starting intelligent plot detection and execution")
    
    # Add required imports if missing
    required_imports = [
        'import matplotlib.pyplot as plt',
        'import numpy as np', 
        'import base64',
        'from io import BytesIO'
    ]
    
    for imp in required_imports:
        if imp not in code:
            try:
                exec(imp, global_vars)
            except:
                pass
    
    # Execute with smart detection
    smart_execute_code(code, global_vars)
    
    print("[SMART SYSTEM] Execution completed")
    return global_vars.get('forge_result', None)

# Export for use in the runtime
__all__ = ['execute_with_smart_detection', 'SmartPlotDetector']
