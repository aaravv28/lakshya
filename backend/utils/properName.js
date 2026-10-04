// For clean-up scripts: finds the proper name on a fixed list (departments, industries) for a value saved
// before the list existed, ignoring capitals and spacing. `renames` maps other old values to a proper name.
const nameKey = (name) => String(name).trim().replace(/\s+/g, " ").toLowerCase();

const properNameFinder = (list, renames = {}) => {
    const byKey = new Map(list.map((name) => [nameKey(name), name]));
    for (const [from, to] of Object.entries(renames)) {
        // Scripts write straight to the database, past the model's checks, so a mistyped rename would stick.
        if (!list.includes(to)) throw new Error(`Rename target "${to}" is not on the list`);
        byKey.set(nameKey(from), to);
    }
    return (name) => (name ? byKey.get(nameKey(name)) : undefined);
};

module.exports = { properNameFinder };
