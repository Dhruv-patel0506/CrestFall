"""
run_tests.py - Unified Test Runner and Validation Report Generator.
Executes all unit, integration, stress, and calibration tests.
Outputs a clean summary of passes, test durations, and mathematical metrics.
"""

import unittest
import sys
import os
import time

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

def run_all_tests():
    print("=" * 70)
    print("  SCENARIO INTELLIGENCE ENGINE - VERIFICATION & VALIDATION SUITE")
    print("  Checkpoints 5 & 6: Mathematical Invariance & Scenario Testing")
    print("=" * 70)

    loader = unittest.TestLoader()
    suite = loader.discover(start_dir=CURRENT_DIR, pattern="test_*.py")

    start_time = time.time()
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    elapsed = time.time() - start_time

    print("\n" + "=" * 70)
    print(f"  TEST EXECUTION SUMMARY:")
    print(f"  Tests Run: {result.testsRun}")
    print(f"  Failures:  {len(result.failures)}")
    print(f"  Errors:    {len(result.errors)}")
    print(f"  Time:      {elapsed:.3f} seconds")
    print(f"  Status:    {'PASSED (100% SUCCESS)' if result.wasSuccessful() else 'FAILED'}")
    print("=" * 70)

    return 0 if result.wasSuccessful() else 1

if __name__ == '__main__':
    sys.exit(run_all_tests())
