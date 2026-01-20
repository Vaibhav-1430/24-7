// Environment validation utility for Netlify functions
const { errorResponse } = require('./response');

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = {
    MONGODB_URI: {
        name: 'MONGODB_URI',
        description: 'MongoDB Atlas connection string',
        validator: (value) => {
            if (!value) return 'Database configuration missing';
            if (!value.startsWith('mongodb://') && !value.startsWith('mongodb+srv://')) {
                return 'Invalid database connection string format';
            }
            if (value.includes('xxxxx') || value.includes('placeholder')) {
                return 'Database connection string contains placeholder values';
            }
            return null;
        }
    },
    JWT_SECRET: {
        name: 'JWT_SECRET',
        description: 'JWT signing secret',
        validator: (value) => {
            if (!value) return 'Authentication configuration missing';
            if (value.length < 32) {
                return 'JWT secret must be at least 32 characters long';
            }
            return null;
        }
    },
    NODE_ENV: {
        name: 'NODE_ENV',
        description: 'Node environment (development/production)',
        validator: (value) => {
            if (!value) return null; // Optional, defaults to 'development'
            if (!['development', 'production', 'test'].includes(value)) {
                return 'NODE_ENV must be development, production, or test';
            }
            return null;
        }
    }
};

/**
 * Validate all required environment variables
 * @returns {Object} Validation result with success status and errors
 */
const validateEnvironment = () => {
    const errors = [];
    const config = {};
    
    for (const [key, envVar] of Object.entries(REQUIRED_ENV_VARS)) {
        const value = process.env[key];
        const error = envVar.validator(value);
        
        if (error) {
            errors.push({
                variable: key,
                description: envVar.description,
                error: error
            });
        } else {
            config[key] = value || (key === 'NODE_ENV' ? 'development' : value);
        }
    }
    
    return {
        success: errors.length === 0,
        errors,
        config
    };
};

/**
 * Get validated configuration object
 * @returns {Object} Configuration object or throws error
 */
const getConfig = () => {
    const validation = validateEnvironment();
    
    if (!validation.success) {
        const errorMessages = validation.errors.map(err => 
            `${err.variable} (${err.description}): ${err.error}`
        );
        throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`);
    }
    
    return {
        mongodbUri: validation.config.MONGODB_URI,
        jwtSecret: validation.config.JWT_SECRET,
        nodeEnv: validation.config.NODE_ENV || 'development',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5000'
    };
};

/**
 * Validate environment and return error response if validation fails
 * @returns {Object|null} Error response object or null if validation passes
 */
const validateEnvironmentForFunction = () => {
    const validation = validateEnvironment();
    
    if (!validation.success) {
        const primaryError = validation.errors[0];
        console.error('Environment validation failed:', validation.errors);
        
        return errorResponse(
            primaryError.error,
            500,
            process.env.NODE_ENV === 'development' ? validation.errors : undefined
        );
    }
    
    return null;
};

/**
 * Get sanitized environment information for debugging
 * @returns {Object} Safe environment information
 */
const getEnvironmentInfo = () => {
    const validation = validateEnvironment();
    
    return {
        validation: {
            success: validation.success,
            errorCount: validation.errors.length,
            errors: validation.errors.map(err => ({
                variable: err.variable,
                description: err.description,
                hasValue: !!process.env[err.variable],
                error: err.error
            }))
        },
        environment: {
            NODE_ENV: process.env.NODE_ENV || 'development',
            MONGODB_URI_SET: !!process.env.MONGODB_URI,
            MONGODB_URI_LENGTH: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
            MONGODB_URI_VALID: process.env.MONGODB_URI && 
                (process.env.MONGODB_URI.startsWith('mongodb://') || 
                 process.env.MONGODB_URI.startsWith('mongodb+srv://')) &&
                !process.env.MONGODB_URI.includes('xxxxx'),
            JWT_SECRET_SET: !!process.env.JWT_SECRET,
            JWT_SECRET_LENGTH: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
            FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
        }
    };
};

module.exports = {
    validateEnvironment,
    getConfig,
    validateEnvironmentForFunction,
    getEnvironmentInfo,
    REQUIRED_ENV_VARS
};