"""
Performance comparison between original and optimized function implementations.
"""

import time
import tracemalloc
from typing import List, Dict, Any
from optimized_function import optimized_example_function, safe_example_function, batch_process_values


def original_example_function(input_value):
    """
    Original function from the image (reconstructed for comparison).
    This demonstrates the issues with the original implementation.
    """
    try:
        result = input_value * 2
        return result
    except TypeError:
        print("Error: Input must be a type that supports multiplication (e.g., numbers or strings)")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None


def measure_performance(func, args_list: List[tuple], iterations: int = 1000) -> Dict[str, Any]:
    """
    Measure performance metrics for a function with given arguments.
    
    Args:
        func: Function to test
        args_list: List of argument tuples to test with
        iterations: Number of iterations to run
        
    Returns:
        Dictionary with performance metrics
    """
    # Start memory tracing
    tracemalloc.start()
    
    start_time = time.perf_counter()
    
    results = []
    errors = 0
    
    for _ in range(iterations):
        for args in args_list:
            try:
                if len(args) == 1:
                    result = func(args[0])
                else:
                    result = func(*args)
                results.append(result)
            except Exception:
                errors += 1
    
    end_time = time.perf_counter()
    
    # Get memory usage
    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    
    return {
        'execution_time': end_time - start_time,
        'average_time_per_call': (end_time - start_time) / (iterations * len(args_list)),
        'successful_calls': len(results),
        'errors': errors,
        'memory_current': current / 1024 / 1024,  # MB
        'memory_peak': peak / 1024 / 1024,        # MB
        'results_sample': results[:5] if results else []
    }


def run_performance_comparison():
    """Run comprehensive performance comparison."""
    
    print("=== Performance Comparison: Original vs Optimized ===\n")
    
    # Test data
    test_cases = [
        (5,),
        (3.14,),
        ("Hello",),
        (100,),
        (2.5,),
    ]
    
    batch_test_data = [1, 2.5, "test", 42, "hello", 7.8, "world", 999]
    
    # Test original function
    print("1. Testing Original Function:")
    original_metrics = measure_performance(original_example_function, test_cases, 1000)
    print(f"   Execution time: {original_metrics['execution_time']:.4f}s")
    print(f"   Average per call: {original_metrics['average_time_per_call']:.6f}s")
    print(f"   Successful calls: {original_metrics['successful_calls']}")
    print(f"   Errors: {original_metrics['errors']}")
    print(f"   Peak memory: {original_metrics['memory_peak']:.2f}MB")
    
    # Test optimized function
    print("\n2. Testing Optimized Function:")
    optimized_test_cases = [(args[0], 2) for args in test_cases]  # Add multiplier parameter
    optimized_metrics = measure_performance(optimized_example_function, optimized_test_cases, 1000)
    print(f"   Execution time: {optimized_metrics['execution_time']:.4f}s")
    print(f"   Average per call: {optimized_metrics['average_time_per_call']:.6f}s")
    print(f"   Successful calls: {optimized_metrics['successful_calls']}")
    print(f"   Errors: {optimized_metrics['errors']}")
    print(f"   Peak memory: {optimized_metrics['memory_peak']:.2f}MB")
    
    # Test safe function
    print("\n3. Testing Safe Function:")
    safe_metrics = measure_performance(safe_example_function, optimized_test_cases, 1000)
    print(f"   Execution time: {safe_metrics['execution_time']:.4f}s")
    print(f"   Average per call: {safe_metrics['average_time_per_call']:.6f}s")
    print(f"   Successful calls: {safe_metrics['successful_calls']}")
    print(f"   Errors: {safe_metrics['errors']}")
    print(f"   Peak memory: {safe_metrics['memory_peak']:.2f}MB")
    
    # Performance improvements
    print("\n=== Performance Improvements ===")
    if original_metrics['execution_time'] > 0:
        speedup = original_metrics['execution_time'] / optimized_metrics['execution_time']
        print(f"Speed improvement (Optimized vs Original): {speedup:.2f}x faster")
    
    memory_reduction = (original_metrics['memory_peak'] - optimized_metrics['memory_peak']) / original_metrics['memory_peak'] * 100
    print(f"Memory reduction (Optimized vs Original): {memory_reduction:.1f}%")
    
    # Batch processing test
    print("\n4. Batch Processing Performance:")
    
    # Simulate individual processing
    start_time = time.perf_counter()
    individual_results = []
    for value in batch_test_data:
        try:
            result = optimized_example_function(value, 2)
            individual_results.append({'success': True, 'result': result})
        except Exception as e:
            individual_results.append({'success': False, 'error': str(e)})
    individual_time = time.perf_counter() - start_time
    
    # Batch processing
    start_time = time.perf_counter()
    batch_results = batch_process_values(batch_test_data, 2)
    batch_time = time.perf_counter() - start_time
    
    print(f"   Individual processing time: {individual_time:.6f}s")
    print(f"   Batch processing time: {batch_time:.6f}s")
    if batch_time > 0:
        batch_speedup = individual_time / batch_time
        print(f"   Batch processing speedup: {batch_speedup:.2f}x faster")


def demonstrate_error_handling():
    """Demonstrate improved error handling capabilities."""
    
    print("\n=== Error Handling Demonstration ===\n")
    
    problematic_inputs = [
        (None, "None value"),
        ([1, 2, 3], "List input"),
        ({}, "Dictionary input"),
        (5, "Normal integer"),
        ("test", "Normal string"),
        (float('inf'), "Infinity"),
        (10**20, "Very large number"),
        ("a" * 1000, "Long string"),
    ]
    
    print("1. Original Function Error Handling:")
    for value, description in problematic_inputs:
        try:
            result = original_example_function(value)
            print(f"   {description}: {result}")
        except Exception as e:
            print(f"   {description}: Exception - {e}")
    
    print("\n2. Optimized Function Error Handling:")
    for value, description in problematic_inputs:
        try:
            if isinstance(value, (int, float, str)):
                result = optimized_example_function(value, 2)
                print(f"   {description}: {result}")
            else:
                result = optimized_example_function(value, 2)
        except Exception as e:
            print(f"   {description}: Exception - {e}")
    
    print("\n3. Safe Function Error Handling (Never crashes):")
    for value, description in problematic_inputs:
        result = safe_example_function(value, 2)
        if result['success']:
            print(f"   {description}: Success - {result['result']}")
        else:
            print(f"   {description}: Error - {result['error']['message']}")


def main():
    """Run all demonstrations."""
    run_performance_comparison()
    demonstrate_error_handling()
    
    print("\n=== Key Optimizations Made ===")
    optimizations = [
        "✓ Added comprehensive type hints for better IDE support and runtime checking",
        "✓ Implemented proper input validation with clear error messages",
        "✓ Added overflow protection for numeric operations",
        "✓ Created memory-efficient string processing with size limits",
        "✓ Separated concerns with helper functions for better maintainability",
        "✓ Added detailed logging for debugging and monitoring",
        "✓ Created a safe wrapper function that never throws exceptions",
        "✓ Implemented batch processing for improved performance with multiple values",
        "✓ Added comprehensive documentation with examples",
        "✓ Included performance monitoring and memory optimization",
    ]
    
    for opt in optimizations:
        print(f"  {opt}")
    
    print("\n=== Usage Recommendations ===")
    recommendations = [
        "• Use optimized_example_function() for normal operations with proper error handling",
        "• Use safe_example_function() when you need guaranteed non-throwing behavior",
        "• Use batch_process_values() when processing multiple values for better performance",
        "• Monitor logs for warnings about large numbers or memory usage",
        "• Consider the memory implications when multiplying large strings",
    ]
    
    for rec in recommendations:
        print(f"  {rec}")


if __name__ == "__main__":
    main()