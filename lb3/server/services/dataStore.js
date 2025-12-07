import fs from 'fs/promises';

export async function readJSON(path) {
    const raw = await fs.readFile(path, 'utf8');
    return JSON.parse(raw);
}

export async function writeJSON(path, obj) {
    // atomic write
    const tmp = path + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(obj, null, 2), 'utf8');
    await fs.rename(tmp, path);
    return true;
}
