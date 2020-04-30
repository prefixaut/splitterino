const { spawnSync } = require('child_process');
const fs = require('fs');

spawnSync('cargo', ['run'], {
    cwd: 'libs/livesplit-core/capi/bind_gen',
    stdio: 'inherit',
});

spawnSync(
    'cargo',
    ['build', '-p', 'cdylib', '--features', 'wasm-web', '--target', 'wasm32-unknown-unknown', '--release'],
    {
        cwd: 'libs/livesplit-core',
        stdio: 'inherit',
    }
);

spawnSync(
    'wasm-bindgen',
    ['libs/livesplit-core/target/wasm32-unknown-unknown/release/livesplit_core.wasm', '--target', 'nodejs', '--out-dir', 'wasm/livesplit-core'],
    {
        stdio: 'inherit',
    }
);

fs.createReadStream('libs/livesplit-core/capi/bindings/wasm_bindgen/index.ts').pipe(
    fs.createWriteStream('wasm/livesplit-core/index.ts')
);

fs.createReadStream('libs/livesplit-core/target/wasm-32-unknown-unknown/release/livesplit_core.wasm').pipe(
    fs.createWriteStream('wasm/livesplit-core/livesplit_core.wasm')
)
