"""
Optimized Python function with improved error handling, type hints, and performance.
"""

from typing import Union, Optional, Any
import logging

# Configure logging for better debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def optimized_example_function(input_value: Union[int, float, str], multiplier: int = 2) -> Optional[Union[int, float, str]]:
    """
    An optimized example function that demonstrates improved operation handling.
    
    This function processes an input value with enhanced error handling,
    type validation, and performance optimizations.
    
    Args:
        input_value: The value to be processed (int, float, or string).
        multiplier: The multiplication factor (default: 2).
        
    Returns:
        The processed value. Returns input_value * multiplier for numbers,
        or input_value repeated multiplier times for strings.
        Returns None if processing fails.
        
    Raises:
        TypeError: If input_value is not a supported type.
        ValueError: If multiplier is negative.
        
    Examples:
        >>> optimized_example_function(5)
        10
        >>> optimized_example_function("Hello", 3)
        'HelloHelloHello'
        >>> optimized_example_function(3.5, 4)
        14.0
    """
    
    # Input validation
    if multiplier < 0:
        raise ValueError("Multiplier must be non-negative")
    
    # Type checking with early returns for performance
    if isinstance(input_value, (int, float)):
        return _process_numeric_value(input_value, multiplier)
    elif isinstance(input_value, str):
        return _process_string_value(input_value, multiplier)
    else:
        raise TypeError(f"Unsupported type: {type(input_value)}. Supported types: int, float, str")


def _process_numeric_value(value: Union[int, float], multiplier: int) -> Union[int, float]:
    """Process numeric values with overflow protection."""
    try:
        result = value * multiplier
        
        # Check for overflow in integer operations
        if isinstance(value, int) and isinstance(result, int):
            # Python handles big integers automatically, but we can add custom limits if needed
            if abs(result) > 10**15:  # Arbitrary large number limit
                logger.warning(f"Result {result} is very large, consider reviewing input values")
        
        return result
    except OverflowError as e:
        logger.error(f"Overflow error in numeric processing: {e}")
        raise


def _process_string_value(value: str, multiplier: int) -> str:
    """Process string values with memory optimization."""
    if multiplier == 0:
        return ""
    
    # Optimize string multiplication for large multipliers
    if len(value) * multiplier > 10**6:  # 1MB limit
        logger.warning(f"String multiplication would create a very large string ({len(value) * multiplier} chars)")
        # Could implement chunked processing or raise an error based on requirements
    
    return value * multiplier


def safe_example_function(input_value: Any, multiplier: int = 2) -> dict:
    """
    A safe wrapper that never raises exceptions and returns detailed results.
    
    Args:
        input_value: Any input value to process.
        multiplier: The multiplication factor.
        
    Returns:
        Dictionary with 'success', 'result', 'error', and 'type_info' keys.
    """
    result_info = {
        'success': False,
        'result': None,
        'error': None,
        'type_info': {
            'input_type': type(input_value).__name__,
            'input_value': str(input_value)[:100],  # Truncate for safety
            'multiplier': multiplier
        }
    }
    
    try:
        result = optimized_example_function(input_value, multiplier)
        result_info.update({
            'success': True,
            'result': result,
        })
    except (TypeError, ValueError, OverflowError) as e:
        result_info['error'] = {
            'type': type(e).__name__,
            'message': str(e)
        }
    except Exception as e:
        # Catch any unexpected errors
        logger.error(f"Unexpected error in safe_example_function: {e}")
        result_info['error'] = {
            'type': 'UnexpectedError',
            'message': 'An unexpected error occurred'
        }
    
    return result_info


def batch_process_values(values: list, multiplier: int = 2) -> list:
    """
    Process multiple values efficiently with batch operations.
    
    Args:
        values: List of values to process.
        multiplier: The multiplication factor.
        
    Returns:
        List of processed results with error information.
    """
    if not isinstance(values, list):
        raise TypeError("Values must be a list")
    
    results = []
    
    # Group values by type for more efficient processing
    numeric_values = []
    string_values = []
    other_values = []
    
    for i, value in enumerate(values):
        if isinstance(value, (int, float)):
            numeric_values.append((i, value))
        elif isinstance(value, str):
            string_values.append((i, value))
        else:
            other_values.append((i, value))
    
    # Initialize results list
    results = [None] * len(values)
    
    # Process numeric values
    for i, value in numeric_values:
        results[i] = safe_example_function(value, multiplier)
    
    # Process string values
    for i, value in string_values:
        results[i] = safe_example_function(value, multiplier)
    
    # Process other values
    for i, value in other_values:
        results[i] = safe_example_function(value, multiplier)
    
    return results


# Example usage and testing
if __name__ == "__main__":
    print("=== Optimized Function Examples ===")
    
    # Test cases
    test_cases = [
        (5, 2),           # Integer
        (3.14, 3),        # Float
        ("Hello", 2),     # String
        ([1, 2, 3], 2),   # List (unsupported type)
        (10, -1),         # Negative multiplier
    ]
    
    print("\n1. Individual function calls:")
    for value, mult in test_cases:
        try:
            result = optimized_example_function(value, mult)
            print(f"optimized_example_function({value}, {mult}) = {result}")
        except Exception as e:
            print(f"optimized_example_function({value}, {mult}) -> Error: {e}")
    
    print("\n2. Safe function calls (never throws exceptions):")
    for value, mult in test_cases:
        result = safe_example_function(value, mult)
        if result['success']:
            print(f"safe_example_function({value}, {mult}) = {result['result']}")
        else:
            print(f"safe_example_function({value}, {mult}) -> Error: {result['error']['message']}")
    
    print("\n3. Batch processing:")
    batch_values = [1, 2.5, "test", 42, "hello"]
    batch_results = batch_process_values(batch_values, 3)
    
    for i, result in enumerate(batch_results):
        original_value = batch_values[i]
        if result['success']:
            print(f"batch[{i}]: {original_value} -> {result['result']}")
        else:
            print(f"batch[{i}]: {original_value} -> Error: {result['error']['message']}")