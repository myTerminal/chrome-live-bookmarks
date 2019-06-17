/* global chrome */

// Properties collection
const properties = [];

// Initializes listener for all known properties
export const init = () => {
    chrome.storage.sync.onChanged.addListener(
        values => {
            Object.keys(values)
                .forEach(
                    k => {
                        // Find a property by the name
                        const property = properties.filter(p => p.name === k)[0];

                        // If a property is found, call its loader
                        if (property) {
                            property.load(values[k].newValue);
                        }
                    }
                );
        }
    );
};

// Creates a property with a name, possible values and a set of handlers
export const createProperty = (
    propertyName,
    propertyValues,
    loader
) => {
    // Find a known property with the same name
    const possibleExistingProperties = properties.filter(p => p.name === propertyName).length;

    // If the property exists, return it
    if (possibleExistingProperties.length) {
        return possibleExistingProperties[0];
    }

    // Create a new property
    const property = {
        name: propertyName,
        values: propertyValues,
        set: (value, onDone) => {
            chrome.storage.sync.set(
                {
                    [propertyName]: value
                },
                onDone
            );
        },
        get: onDone => {
            chrome.storage.sync.get(
                [
                    propertyName
                ],
                values => {
                    onDone(values[propertyName] || propertyValues[0]);
                }
            );
        },
        load: loader
    };

    // Add the property to the collection
    properties.push(property);

    // Try loading reading and loading the property
    property.get(property.load);

    // Return the newly created property
    return property;
};
