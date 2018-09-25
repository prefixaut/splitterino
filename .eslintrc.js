// https://eslint.org/docs/user-guide/configuring

module.exports = {
    root: true,

    parserOptions: {
        parser: 'typescript-eslint-parser'
    },

    env: {
        browser: true
    },

    extends: ['plugin:vue/essential'],

    // required to lint *.vue files
    plugins: ['vue', 'prettier'],

    // add your custom rules here
    rules: {
        code: 80,
        // allow async-await
        'generator-star-spacing': 'off',
        // allow debugger during development
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-console': ['off'],
        indent: 'off',
        'linebreak-style': ['off'],
        quotes: [
            'error',
            'single',
            {
                avoidEscape: true,
                allowTemplateLiterals: true
            }
        ],
        semi: ['error', 'always'],
        'space-before-function-paren': 0,
        'comma-dangle': 'off'
    },

    extends: ['plugin:vue/essential', '@vue/typescript']
};
