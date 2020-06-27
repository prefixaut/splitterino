/*
 * Simple helper script which creates a new package.json for when the package
 * is being distributed to npm.
 * The generated package.json does not have any dependencies, as it doesn't need any.
 */
const fs = require('fs');
const path = require('path');
const originalPackage = require(path.resolve(__dirname, '../package.json'));
const allOriginalDependencies = {
    ...originalPackage.dependencies,
    ...originalPackage.devDependencies,
};

const newPackage = {
    types: 'src/package-export.d.ts',
    private: false,
    dependencies: {},
    files: ['src/**/*.d.ts'],
};

[
    'name',
    'version',
    'license',
    'auhor',
    'contributors',
    'homepage',
    'keywords',
    'description',
    'repository',
    'bugs',
].forEach(key => {
    newPackage[key] = originalPackage[key];
});

[
    'electron',
    'lightweight-di',
    'rxjs',
    'zeromq'
].forEach(dependency => {
    newPackage.dependencies[dependency] = allOriginalDependencies[dependency];
});

fs.writeFileSync(
    path.resolve(__dirname, '../dist_package/package.json'),
    JSON.stringify(newPackage, null, 4)
);
