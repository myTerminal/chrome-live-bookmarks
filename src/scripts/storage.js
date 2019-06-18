/* global chrome */

// Collections of properties
const localProperties = [],
    syncedProperties = [];

// Initializes listener for all known properties
export const initializeStorage = () => {
    chrome.storage.local.onChanged
        .addListener(getChangedPropertySetLoader(localProperties));
    chrome.storage.sync.onChanged
        .addListener(getChangedPropertySetLoader(syncedProperties));
};

// Creates a local property
export const createLocalProperty = (
    propertyName,
    propertyValues,
    loader
) =>
    createProperty(
        chrome.storage.local,
        propertyName,
        propertyValues,
        loader,
        localProperties
    );

// Creates a synced property
export const createSyncedProperty = (
    propertyName,
    propertyValues,
    loader
) =>
    createProperty(
        chrome.storage.sync,
        propertyName,
        propertyValues,
        loader,
        syncedProperties
    );

// Create a listener for a property type
const getChangedPropertySetLoader = collection =>
    values => {
        Object.keys(values)
            .forEach(
                k => {
                    // Find a property by the name
                    const property = collection.filter(p => p.name === k)[0];

                    // If a property is found, call its loader
                    if (property) {
                        property.load(values[k].newValue);
                    }
                }
            );
    };

// Creates a property with a type, name, set of possible values and a loader
const createProperty = (
    store,
    propertyName,
    propertyValues,
    loader,
    collection
) => {
    // Find a known property with the same name
    const possibleExistingProperties = collection.filter(p => p.name === propertyName).length;

    // If the property exists, return it
    if (possibleExistingProperties.length) {
        return possibleExistingProperties[0];
    }

    // Create a new property
    const property = {
        name: propertyName,
        values: propertyValues,
        set: createSetter(store, propertyName),
        get: createGetter(store, propertyName, propertyValues),
        load: loader
    };

    // Add the property to the collection
    collection.push(property);

    // Try loading reading and loading the property
    property.get(property.load);

    // Return the newly created property
    return property;
};

// Function to create setter
const createSetter = (store, name) =>
    (value, onDone) => {
        store.set(
            {
                [name]: value
            },
            onDone
        );
    };

// Function to create getter
const createGetter = (store, name, possibleValues) =>
    onDone => {
        store.get(
            [
                name
            ],
            values => {
                onDone(values[name] || possibleValues[0]);
            }
        );
    };
