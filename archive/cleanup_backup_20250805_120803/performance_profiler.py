#!/usr/bin/env python3
"""
Advanced Performance Profiling System
=====================================

This module provides comprehensive performance profiling and optimization:
- CPU profiling with cProfile and line_profiler
- Memory profiling with memory_profiler and tracemalloc
- GPU profiling support
- Performance bottleneck detection
- Optimization recommendations
- Real-time performance monitoring

Author: Advanced Analytics Team
Version: 1.0.0
"""

import cProfile
import pstats
import io
import time
import tracemalloc
import psutil
import threading
import json
import functools
import gc
import sys
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Callable, Tuple
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Try to import line_profiler and memory_profiler
try:
    from line_profiler import LineProfiler
    LINE_PROFILER_AVAILABLE = True
except ImportError:
    LINE_PROFILER_AVAILABLE = False

try:
    from memory_profiler import profile as memory_profile
    MEMORY_PROFILER_AVAILABLE = True
except ImportError:
    MEMORY_PROFILER_AVAILABLE = False

@dataclass
class PerformanceMetrics:
    """Performance metrics for a function or code block."""
    function_name: str
    execution_time: float
    cpu_percent: float
    memory_usage_mb: float
    memory_peak_mb: float
    call_count: int
    timestamp: datetime
    
@dataclass
class BottleneckReport:
    """Performance bottleneck analysis report."""
    function_name: str
    total_time: float
    cumulative_time: float
    call_count: int
    time_per_call: float
    percentage_of_total: float
    recommendation: str

class PerformanceProfiler:
    """Advanced performance profiling system."""
    
    def __init__(self, enable_memory_tracking: bool = True):
        """Initialize the performance profiler."""
        self.enable_memory_tracking = enable_memory_tracking
        self.profiling_data = defaultdict(list)
        self.active_profilers = {}
        self.performance_history = deque(maxlen=1000)
        
        # Memory tracking
        if enable_memory_tracking:
            tracemalloc.start()
        
        # System monitoring
        self.system_metrics = deque(maxlen=100)
        self.monitoring_active = False
        self.monitor_thread = None
        
        print("🔍 Performance Profiler initialized")
    
    def profile_function(self, func: Callable = None, *, 
                        memory: bool = True, 
                        cpu: bool = True,
                        line_by_line: bool = False):
        """Decorator to profile function performance."""
        def decorator(f):
            @functools.wraps(f)
            def wrapper(*args, **kwargs):
                return self._profile_execution(
                    f, args, kwargs, 
                    memory=memory, 
                    cpu=cpu, 
                    line_by_line=line_by_line
                )
            return wrapper
        
        if func is None:
            return decorator
        else:
            return decorator(func)
    
    def _profile_execution(self, func: Callable, args: tuple, kwargs: dict,
                          memory: bool, cpu: bool, line_by_line: bool) -> Any:
        """Execute function with profiling."""
        func_name = func.__name__
        
        # Pre-execution metrics
        process = psutil.Process()
        start_memory = process.memory_info().rss / 1024 / 1024  # MB
        start_cpu = process.cpu_percent()
        
        if self.enable_memory_tracking and memory:
            tracemalloc_snapshot_start = tracemalloc.take_snapshot()
        
        # CPU profiling setup
        if cpu:
            profiler = cProfile.Profile()
            profiler.enable()
        
        # Line-by-line profiling setup
        if line_by_line and LINE_PROFILER_AVAILABLE:
            line_profiler = LineProfiler()
            line_profiler.add_function(func)
            line_profiler.enable_by_count()
        
        # Execute function
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
        finally:
            end_time = time.time()
            execution_time = end_time - start_time
            
            # Post-execution metrics
            end_memory = process.memory_info().rss / 1024 / 1024  # MB
            end_cpu = process.cpu_percent()
            
            # Memory profiling
            peak_memory = end_memory
            if self.enable_memory_tracking and memory:
                tracemalloc_snapshot_end = tracemalloc.take_snapshot()
                top_stats = tracemalloc_snapshot_end.compare_to(
                    tracemalloc_snapshot_start, 'lineno'
                )
                if top_stats:
                    peak_memory = max(end_memory, start_memory + sum(
                        stat.size_diff for stat in top_stats[:10]
                    ) / 1024 / 1024)
            
            # CPU profiling results
            if cpu:
                profiler.disable()
                self._save_cpu_profile(func_name, profiler)
            
            # Line profiling results
            if line_by_line and LINE_PROFILER_AVAILABLE:
                line_profiler.disable_by_count()
                self._save_line_profile(func_name, line_profiler)
            
            # Store performance metrics
            metrics = PerformanceMetrics(
                function_name=func_name,
                execution_time=execution_time,
                cpu_percent=(start_cpu + end_cpu) / 2,
                memory_usage_mb=end_memory - start_memory,
                memory_peak_mb=peak_memory,
                call_count=1,
                timestamp=datetime.now()
            )
            
            self.profiling_data[func_name].append(metrics)
            self.performance_history.append(metrics)
            
        return result
    
    def _save_cpu_profile(self, func_name: str, profiler: cProfile.Profile):
        """Save CPU profiling results."""
        stream = io.StringIO()
        stats = pstats.Stats(profiler, stream=stream)
        stats.sort_stats('cumulative')
        stats.print_stats(20)  # Top 20 functions
        
        profile_output = stream.getvalue()
        
        # Save to file
        profile_file = f"/root/FCA/profiles/cpu_profile_{func_name}_{int(time.time())}.txt"
        os.makedirs(os.path.dirname(profile_file), exist_ok=True)
        
        with open(profile_file, 'w') as f:
            f.write(profile_output)
        
        print(f"💾 CPU profile saved: {profile_file}")
    
    def _save_line_profile(self, func_name: str, line_profiler: 'LineProfiler'):
        """Save line-by-line profiling results."""
        if not LINE_PROFILER_AVAILABLE:
            return
        
        profile_file = f"/root/FCA/profiles/line_profile_{func_name}_{int(time.time())}.txt"
        os.makedirs(os.path.dirname(profile_file), exist_ok=True)
        
        with open(profile_file, 'w') as f:
            line_profiler.print_stats(stream=f)
        
        print(f"📝 Line profile saved: {profile_file}")
    
    def start_system_monitoring(self, interval: float = 1.0):
        """Start continuous system monitoring."""
        if self.monitoring_active:
            print("⚠️  System monitoring already active")
            return
        
        self.monitoring_active = True
        self.monitor_thread = threading.Thread(
            target=self._monitor_system_loop, 
            args=(interval,)
        )
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
        
        print(f"📊 System monitoring started (interval: {interval}s)")
    
    def stop_system_monitoring(self):
        """Stop system monitoring."""
        self.monitoring_active = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        
        print("⏹️  System monitoring stopped")
    
    def _monitor_system_loop(self, interval: float):
        """System monitoring loop."""
        while self.monitoring_active:
            try:
                process = psutil.Process()
                
                metrics = {
                    'timestamp': datetime.now(),
                    'cpu_percent': process.cpu_percent(),
                    'memory_mb': process.memory_info().rss / 1024 / 1024,
                    'memory_percent': psutil.virtual_memory().percent,
                    'threads': process.num_threads(),
                    'file_descriptors': process.num_fds() if hasattr(process, 'num_fds') else 0
                }
                
                self.system_metrics.append(metrics)
                
                time.sleep(interval)
                
            except Exception as e:
                print(f"Error in monitoring loop: {e}")
                time.sleep(interval)
    
    def benchmark_function(self, func: Callable, args: tuple = (), kwargs: dict = None, 
                          iterations: int = 10) -> Dict[str, Any]:
        """Benchmark a function with multiple iterations."""
        if kwargs is None:
            kwargs = {}
        
        print(f"🏃 Benchmarking {func.__name__} ({iterations} iterations)")
        
        execution_times = []
        memory_usages = []
        
        for i in range(iterations):
            # Memory before
            if self.enable_memory_tracking:
                gc.collect()  # Force garbage collection
                mem_before = psutil.Process().memory_info().rss / 1024 / 1024
            
            # Execute with timing
            start_time = time.perf_counter()
            result = func(*args, **kwargs)
            end_time = time.perf_counter()
            
            execution_time = end_time - start_time
            execution_times.append(execution_time)
            
            # Memory after
            if self.enable_memory_tracking:
                mem_after = psutil.Process().memory_info().rss / 1024 / 1024
                memory_usages.append(mem_after - mem_before)
        
        # Calculate statistics
        stats = {
            'function_name': func.__name__,
            'iterations': iterations,
            'execution_times': execution_times,
            'memory_usages': memory_usages if self.enable_memory_tracking else [],
            'stats': {
                'mean_time': np.mean(execution_times),
                'median_time': np.median(execution_times),
                'min_time': np.min(execution_times),
                'max_time': np.max(execution_times),
                'std_time': np.std(execution_times),
                'total_time': np.sum(execution_times)
            }
        }
        
        if self.enable_memory_tracking and memory_usages:
            stats['stats'].update({
                'mean_memory': np.mean(memory_usages),
                'peak_memory': np.max(memory_usages),
                'total_memory': np.sum(memory_usages)
            })
        
        print(f"📊 Benchmark complete:")
        print(f"   Mean time: {stats['stats']['mean_time']:.4f}s")
        print(f"   Min time:  {stats['stats']['min_time']:.4f}s")
        print(f"   Max time:  {stats['stats']['max_time']:.4f}s")
        
        return stats
    
    def analyze_bottlenecks(self, func_name: str = None) -> List[BottleneckReport]:
        """Analyze performance bottlenecks."""
        print("🔍 Analyzing performance bottlenecks...")
        
        if func_name:
            data = self.profiling_data.get(func_name, [])
        else:
            # Aggregate all function data
            data = []
            for func_data in self.profiling_data.values():
                data.extend(func_data)
        
        if not data:
            print("⚠️  No profiling data available")
            return []
        
        # Group by function
        function_stats = defaultdict(lambda: {
            'total_time': 0.0,
            'call_count': 0,
            'total_memory': 0.0
        })
        
        total_execution_time = 0.0
        
        for metric in data:
            stats = function_stats[metric.function_name]
            stats['total_time'] += metric.execution_time
            stats['call_count'] += metric.call_count
            stats['total_memory'] += metric.memory_usage_mb
            total_execution_time += metric.execution_time
        
        # Create bottleneck reports
        reports = []
        for func_name, stats in function_stats.items():
            time_per_call = stats['total_time'] / stats['call_count']
            percentage = (stats['total_time'] / total_execution_time * 100) if total_execution_time > 0 else 0
            
            # Generate recommendation
            recommendation = self._generate_optimization_recommendation(
                func_name, stats, time_per_call, percentage
            )
            
            report = BottleneckReport(
                function_name=func_name,
                total_time=stats['total_time'],
                cumulative_time=stats['total_time'],
                call_count=stats['call_count'],
                time_per_call=time_per_call,
                percentage_of_total=percentage,
                recommendation=recommendation
            )
            
            reports.append(report)
        
        # Sort by total time (descending)
        reports.sort(key=lambda x: x.total_time, reverse=True)
        
        return reports
    
    def _generate_optimization_recommendation(self, func_name: str, stats: dict, 
                                            time_per_call: float, percentage: float) -> str:
        """Generate optimization recommendation for a function."""
        recommendations = []
        
        if percentage > 50:
            recommendations.append("HIGH PRIORITY: This function consumes >50% of total execution time")
        elif percentage > 20:
            recommendations.append("MEDIUM PRIORITY: This function consumes >20% of total execution time")
        
        if time_per_call > 1.0:
            recommendations.append("Consider breaking down this function into smaller parts")
        
        if stats['call_count'] > 1000:
            recommendations.append("High call frequency - consider caching or memoization")
        
        if stats['total_memory'] > 100:  # >100MB
            recommendations.append("High memory usage - consider memory optimization")
        
        if not recommendations:
            recommendations.append("Performance is acceptable")
        
        return "; ".join(recommendations)
    
    def generate_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report."""
        print("📋 Generating performance report...")
        
        # Overall statistics
        total_functions = len(self.profiling_data)
        total_calls = sum(len(data) for data in self.profiling_data.values())
        
        if not self.performance_history:
            return {'error': 'No performance data available'}
        
        # Time analysis
        execution_times = [m.execution_time for m in self.performance_history]
        memory_usages = [m.memory_usage_mb for m in self.performance_history]
        
        # System metrics
        system_stats = {}
        if self.system_metrics:
            cpu_values = [m['cpu_percent'] for m in self.system_metrics]
            memory_values = [m['memory_mb'] for m in self.system_metrics]
            
            system_stats = {
                'avg_cpu_percent': np.mean(cpu_values),
                'peak_cpu_percent': np.max(cpu_values),
                'avg_memory_mb': np.mean(memory_values),
                'peak_memory_mb': np.max(memory_values)
            }
        
        # Bottleneck analysis
        bottlenecks = self.analyze_bottlenecks()
        
        report = {
            'summary': {
                'total_functions_profiled': total_functions,
                'total_function_calls': total_calls,
                'report_generated_at': datetime.now().isoformat()
            },
            'execution_time_stats': {
                'mean': np.mean(execution_times),
                'median': np.median(execution_times),
                'min': np.min(execution_times),
                'max': np.max(execution_times),
                'std': np.std(execution_times),
                'total': np.sum(execution_times)
            },
            'memory_stats': {
                'mean_usage_mb': np.mean(memory_usages),
                'peak_usage_mb': np.max(memory_usages),
                'total_usage_mb': np.sum(memory_usages)
            },
            'system_stats': system_stats,
            'top_bottlenecks': [asdict(b) for b in bottlenecks[:10]],
            'optimization_recommendations': self._generate_global_recommendations(bottlenecks)
        }
        
        return report
    
    def _generate_global_recommendations(self, bottlenecks: List[BottleneckReport]) -> List[str]:
        """Generate global optimization recommendations."""
        recommendations = []
        
        if not bottlenecks:
            return ["No performance issues detected"]
        
        # Check for major bottlenecks
        major_bottlenecks = [b for b in bottlenecks if b.percentage_of_total > 30]
        if major_bottlenecks:
            recommendations.append(
                f"Focus optimization on {len(major_bottlenecks)} functions consuming >30% of execution time"
            )
        
        # Memory recommendations
        high_memory_funcs = [b for b in bottlenecks if 'High memory usage' in b.recommendation]
        if high_memory_funcs:
            recommendations.append(
                f"{len(high_memory_funcs)} functions have high memory usage - implement memory optimization"
            )
        
        # Caching recommendations
        high_frequency_funcs = [b for b in bottlenecks if 'caching' in b.recommendation]
        if high_frequency_funcs:
            recommendations.append(
                f"{len(high_frequency_funcs)} functions called frequently - consider caching strategies"
            )
        
        # Parallelization
        if len(bottlenecks) > 3:
            recommendations.append("Consider parallelizing independent operations")
        
        # Algorithm optimization
        slow_funcs = [b for b in bottlenecks if b.time_per_call > 0.1]
        if slow_funcs:
            recommendations.append(
                f"{len(slow_funcs)} functions are slow per call - review algorithms and data structures"
            )
        
        return recommendations
    
    def create_performance_visualization(self, save_path: str = None) -> str:
        """Create performance visualization charts."""
        if not self.performance_history:
            print("⚠️  No performance data to visualize")
            return ""
        
        # Create subplots
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
        fig.suptitle('Performance Analysis Dashboard', fontsize=16, fontweight='bold')
        
        # Data preparation
        timestamps = [m.timestamp for m in self.performance_history]
        execution_times = [m.execution_time for m in self.performance_history]
        memory_usages = [m.memory_usage_mb for m in self.performance_history]
        function_names = [m.function_name for m in self.performance_history]
        
        # 1. Execution time over time
        ax1.plot(timestamps, execution_times, 'b-', alpha=0.7, linewidth=1)
        ax1.set_title('Execution Time Over Time')
        ax1.set_xlabel('Time')
        ax1.set_ylabel('Execution Time (seconds)')
        ax1.grid(True, alpha=0.3)
        
        # 2. Memory usage over time
        ax2.plot(timestamps, memory_usages, 'r-', alpha=0.7, linewidth=1)
        ax2.set_title('Memory Usage Over Time')
        ax2.set_xlabel('Time')
        ax2.set_ylabel('Memory Usage (MB)')
        ax2.grid(True, alpha=0.3)
        
        # 3. Function call frequency
        function_counts = pd.Series(function_names).value_counts().head(10)
        ax3.bar(range(len(function_counts)), function_counts.values)
        ax3.set_title('Top 10 Most Called Functions')
        ax3.set_xlabel('Function')
        ax3.set_ylabel('Call Count')
        ax3.set_xticks(range(len(function_counts)))
        ax3.set_xticklabels(function_counts.index, rotation=45, ha='right')
        
        # 4. Performance distribution
        ax4.hist(execution_times, bins=30, alpha=0.7, color='green', edgecolor='black')
        ax4.set_title('Execution Time Distribution')
        ax4.set_xlabel('Execution Time (seconds)')
        ax4.set_ylabel('Frequency')
        ax4.grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        # Save plot
        if save_path is None:
            save_path = f'/root/FCA/performance_analysis_{int(time.time())}.png'
        
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"📊 Performance visualization saved: {save_path}")
        return save_path
    
    def export_report(self, format: str = 'json', filepath: str = None) -> str:
        """Export performance report to file."""
        report = self.generate_performance_report()
        
        if filepath is None:
            filepath = f'/root/FCA/performance_report_{int(time.time())}.{format}'
        
        if format == 'json':
            with open(filepath, 'w') as f:
                json.dump(report, f, indent=2, default=str)
        elif format == 'csv':
            # Convert to DataFrame for CSV export
            df_data = []
            for metric in self.performance_history:
                df_data.append(asdict(metric))
            
            df = pd.DataFrame(df_data)
            df.to_csv(filepath, index=False)
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        print(f"📄 Performance report exported: {filepath}")
        return filepath
    
    def clear_profiling_data(self):
        """Clear all profiling data."""
        self.profiling_data.clear()
        self.performance_history.clear()
        self.system_metrics.clear()
        print("🧹 Profiling data cleared")

# Convenience functions and decorators
def profile_cpu(func):
    """Simple CPU profiling decorator."""
    profiler = PerformanceProfiler()
    return profiler.profile_function(func, memory=False, line_by_line=False)

def profile_memory(func):
    """Simple memory profiling decorator."""
    profiler = PerformanceProfiler()
    return profiler.profile_function(func, cpu=False, line_by_line=False)

def profile_comprehensive(func):
    """Comprehensive profiling decorator."""
    profiler = PerformanceProfiler()
    return profiler.profile_function(func, memory=True, cpu=True, line_by_line=True)

# Usage examples and testing
def example_slow_function():
    """Example function to demonstrate profiling."""
    # Simulate CPU-intensive work
    total = 0
    for i in range(1000000):
        total += i ** 2
    
    # Simulate memory allocation
    data = list(range(100000))
    processed = [x * 2 for x in data]
    
    return total, len(processed)

def example_memory_intensive():
    """Example memory-intensive function."""
    # Allocate large arrays
    arrays = []
    for i in range(10):
        arr = np.random.randn(1000, 1000)
        arrays.append(arr)
    
    # Process arrays
    result = np.sum([np.mean(arr) for arr in arrays])
    return result

if __name__ == "__main__":
    # Create profiler
    profiler = PerformanceProfiler()
    
    # Start system monitoring
    profiler.start_system_monitoring(interval=0.5)
    
    try:
        print("🔬 Performance Profiling Demo")
        print("=" * 50)
        
        # Profile example functions
        @profiler.profile_function(memory=True, cpu=True)
        def test_function():
            return example_slow_function()
        
        # Run profiled function multiple times
        for i in range(3):
            print(f"\nRun {i+1}:")
            result = test_function()
            time.sleep(1)
        
        # Benchmark function
        benchmark_results = profiler.benchmark_function(
            example_memory_intensive, 
            iterations=5
        )
        
        # Analyze bottlenecks
        print("\n🔍 Bottleneck Analysis:")
        bottlenecks = profiler.analyze_bottlenecks()
        for bottleneck in bottlenecks:
            print(f"- {bottleneck.function_name}: {bottleneck.total_time:.4f}s "
                  f"({bottleneck.percentage_of_total:.1f}%)")
            print(f"  Recommendation: {bottleneck.recommendation}")
        
        # Generate report
        print("\n📋 Generating Performance Report...")
        report = profiler.generate_performance_report()
        
        # Create visualization
        viz_path = profiler.create_performance_visualization()
        
        # Export report
        report_path = profiler.export_report('json')
        
        print(f"\n✅ Profiling complete!")
        print(f"📊 Visualization: {viz_path}")
        print(f"📄 Report: {report_path}")
        
    finally:
        # Stop monitoring
        profiler.stop_system_monitoring()
        
        # Show final summary
        print(f"\n📈 Summary:")
        print(f"Functions profiled: {len(profiler.profiling_data)}")
        print(f"Total measurements: {len(profiler.performance_history)}")
        print(f"System metrics collected: {len(profiler.system_metrics)}")