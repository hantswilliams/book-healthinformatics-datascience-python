import React, { useState, useEffect, useRef } from 'react';

interface PackageSelectorProps {
  selectedPackages: string[];
  onPackagesChange: (packages: string[]) => void;
  disabled?: boolean;
}

interface ValidationState {
  isValidating: boolean;
  isValid: boolean | null;
  error?: string;
}

export default function PackageSelector({ 
  selectedPackages, 
  onPackagesChange, 
  disabled = false 
}: PackageSelectorProps) {
  const [inputValue, setInputValue] = useState("");
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    isValid: null
  });
  const validationTimeoutRef = useRef<NodeJS.Timeout>();

  // Validate package with Pyodide
  const validatePackage = async (packageName: string): Promise<boolean> => {
    if (!packageName.trim()) return false;
    
    try {
      // Check if package is available in Pyodide
      // This is a simplified validation - in practice you might want to check against
      // Pyodide's package index or try importing it
      const response = await fetch(`https://pypi.org/pypi/${packageName.trim()}/json`);
      return response.ok;
    } catch (error) {
      console.error('Package validation error:', error);
      return false;
    }
  };

  // Debounced validation
  useEffect(() => {
    if (!inputValue.trim()) {
      setValidationState({ isValidating: false, isValid: null });
      return;
    }

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    setValidationState({ isValidating: true, isValid: null });

    validationTimeoutRef.current = setTimeout(async () => {
      const isValid = await validatePackage(inputValue);
      setValidationState({
        isValidating: false,
        isValid,
        error: isValid ? undefined : 'Package not found or not compatible with Pyodide'
      });
    }, 500);

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [inputValue]);

  // Ensure selectedPackages is always an array
  console.log('PackageSelector received selectedPackages:', selectedPackages, 'type:', typeof selectedPackages);
  const packagesArray = Array.isArray(selectedPackages) ? selectedPackages : 
                       typeof selectedPackages === 'string' ? JSON.parse(selectedPackages || '[]') : [];
  console.log('PackageSelector using packagesArray:', packagesArray);

  const addPackage = () => {
    const packageName = inputValue.trim();
    if (packageName && validationState.isValid && !packagesArray.includes(packageName)) {
      onPackagesChange([...packagesArray, packageName]);
      setInputValue("");
      setValidationState({ isValidating: false, isValid: null });
    }
  };

  const removePackage = (packageName: string) => {
    onPackagesChange(packagesArray.filter(pkg => pkg !== packageName));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && validationState.isValid) {
      e.preventDefault();
      addPackage();
    }
  };

  const getInputIcon = () => {
    if (validationState.isValidating) {
      return <span style={{ color: '#6b7280' }}>⏳</span>;
    }
    if (validationState.isValid === true) {
      return <span style={{ color: '#16a34a' }}>✅</span>;
    }
    if (validationState.isValid === false) {
      return <span style={{ color: '#dc2626' }}>❌</span>;
    }
    return <span style={{ color: '#6b7280' }}>📦</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          Python Packages
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Package Input */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter package name (e.g., pandas, numpy, matplotlib)..."
                disabled={disabled}
                style={{
                  width: '100%',
                  padding: '8px 40px 8px 12px',
                  border: `1px solid ${
                    validationState.isValid === false ? '#dc2626' : 
                    validationState.isValid === true ? '#16a34a' : '#d1d5db'
                  }`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: disabled ? '#f9fafb' : 'white'
                }}
              />
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)'
              }}>
                {getInputIcon()}
              </div>
            </div>
            <button
              onClick={addPackage}
              disabled={disabled || !validationState.isValid || !inputValue.trim()}
              style={{
                padding: '8px 16px',
                backgroundColor: (disabled || !validationState.isValid || !inputValue.trim()) ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: (disabled || !validationState.isValid || !inputValue.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              Add
            </button>
          </div>

          {/* Validation Error Message */}
          {validationState.error && (
            <p style={{ fontSize: '14px', color: '#dc2626', margin: 0 }}>
              {validationState.error}
            </p>
          )}

          {/* Selected Packages */}
          {packagesArray.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: '#374151' }}>
                Selected packages:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {packagesArray.map((packageName) => (
                  <div
                    key={packageName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      borderRadius: '4px',
                      fontSize: '13px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <span>📦</span>
                    <span>{packageName}</span>
                    {!disabled && (
                      <button
                        onClick={() => removePackage(packageName)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer',
                          padding: '0',
                          marginLeft: '4px',
                          fontSize: '12px'
                        }}
                        title={`Remove ${packageName}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}