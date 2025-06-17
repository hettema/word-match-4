// tests/ice-cubes/contract-validator.js - Event contract validation utilities
import { EventContracts } from '../../src/core/EventTypes.js';

/**
 * Validates event data against its contract
 * @param {string} eventType - The event type to validate
 * @param {object} data - The event data to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validateEventData(eventType, data) {
    const contract = EventContracts[eventType];
    const errors = [];
    
    if (!contract) {
        return { 
            valid: false, 
            errors: [`No contract defined for event type: ${eventType}`] 
        };
    }
    
    // Check each field in the contract
    for (const [field, expectedType] of Object.entries(contract)) {
        if (!(field in data)) {
            errors.push(`Missing required field: ${field}`);
            continue;
        }
        
        const value = data[field];
        const actualType = Array.isArray(value) ? 'Array' : typeof value;
        
        // Handle array types
        if (expectedType.startsWith('Array')) {
            if (!Array.isArray(value)) {
                errors.push(`Field '${field}' must be an Array, got ${actualType}`);
            } else if (expectedType.includes('<') && value.length > 0) {
                // Validate array element types
                const elementType = expectedType.match(/Array<(.+)>/)?.[1];
                if (elementType) {
                    value.forEach((item, index) => {
                        const elementErrors = validateElementType(item, elementType, `${field}[${index}]`);
                        errors.push(...elementErrors);
                    });
                }
            }
        }
        // Handle object shape types
        else if (expectedType.startsWith('{') && expectedType.endsWith('}')) {
            if (typeof value !== 'object' || value === null) {
                errors.push(`Field '${field}' must be an object, got ${actualType}`);
            } else {
                const shapeErrors = validateObjectShape(value, expectedType, field);
                errors.push(...shapeErrors);
            }
        }
        // Handle basic types
        else if (actualType !== expectedType) {
            errors.push(`Field '${field}' must be ${expectedType}, got ${actualType}`);
        }
    }
    
    // Check for extra fields (warning only)
    const extraFields = Object.keys(data).filter(key => !(key in contract));
    if (extraFields.length > 0) {
        console.warn(`Extra fields in ${eventType}:`, extraFields);
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validates an element against its expected type
 */
function validateElementType(element, expectedType, path) {
    const errors = [];
    
    if (expectedType.startsWith('{') && expectedType.endsWith('}')) {
        // Object shape validation
        if (typeof element !== 'object' || element === null) {
            errors.push(`${path} must be an object`);
        } else {
            const shapeErrors = validateObjectShape(element, expectedType, path);
            errors.push(...shapeErrors);
        }
    } else {
        // Simple type validation
        const actualType = Array.isArray(element) ? 'Array' : typeof element;
        if (actualType !== expectedType) {
            errors.push(`${path} must be ${expectedType}, got ${actualType}`);
        }
    }
    
    return errors;
}

/**
 * Validates an object against a shape string like "{x: number, y: number}"
 */
function validateObjectShape(obj, shapeStr, path) {
    const errors = [];
    const shape = shapeStr.match(/{(.+)}/)?.[1];
    
    if (!shape) return errors;
    
    // Parse simple key:type pairs
    const pairs = shape.split(',').map(p => p.trim());
    for (const pair of pairs) {
        const [key, type] = pair.split(':').map(s => s.trim());
        if (key && type) {
            if (!(key in obj)) {
                errors.push(`Missing property '${key}' in ${path}`);
            } else {
                const actualType = typeof obj[key];
                if (actualType !== type) {
                    errors.push(`Property '${key}' in ${path} must be ${type}, got ${actualType}`);
                }
            }
        }
    }
    
    return errors;
}

/**
 * Generates an event audit table showing event flow
 * @param {Array} capturedEvents - Array of captured event records
 * @returns {string} HTML table of event flow
 */
export function generateEventAuditTable(capturedEvents) {
    if (capturedEvents.length === 0) {
        return '<p>No events captured yet</p>';
    }
    
    let html = `
        <table style="border-collapse: collapse; width: 100%;">
            <thead>
                <tr style="background: #34495e; color: white;">
                    <th style="padding: 10px; border: 1px solid #ddd;">Event Name</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Emitted By</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Data Shape</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Consumed By</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    capturedEvents.forEach(event => {
        const dataShape = Object.keys(event.data || {}).map(key => {
            const value = event.data[key];
            const type = Array.isArray(value) ? 'Array' : typeof value;
            return `${key}: ${type}`;
        }).join(', ');
        
        html += `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${event.type}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">Test Harness</td>
                <td style="padding: 10px; border: 1px solid #ddd;">{${dataShape}}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">TBD</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    return html;
}

/**
 * Compares expected vs actual event data for mismatch detection
 * @param {object} expected - Expected event data shape
 * @param {object} actual - Actual event data received
 * @returns {{matches: boolean, report: string}} Comparison result
 */
export function compareEventData(expected, actual) {
    const mismatches = [];
    
    // Check for missing fields
    Object.keys(expected).forEach(key => {
        if (!(key in actual)) {
            mismatches.push(`Missing field: ${key}`);
        } else if (typeof expected[key] !== typeof actual[key]) {
            mismatches.push(`Type mismatch for ${key}: expected ${typeof expected[key]}, got ${typeof actual[key]}`);
        }
    });
    
    // Check for extra fields
    Object.keys(actual).forEach(key => {
        if (!(key in expected)) {
            mismatches.push(`Extra field: ${key}`);
        }
    });
    
    const matches = mismatches.length === 0;
    const report = matches ? 
        'Data shapes match perfectly!' :
        `MISMATCHES FOUND:\n${mismatches.join('\n')}`;
    
    return { matches, report };
}