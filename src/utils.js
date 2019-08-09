
/**
 * Helper for merging two objects
 * @param {*} target 
 * @param {*} source 
 */
function deepMerge(target, source) {
    if (typeof target !== 'object' || typeof source !== 'object') {
        // target or source or both ain't objects, merging doesn't make sense
        return false;
    }
    for (var prop in source) {
      if (!source.hasOwnProperty(prop)) continue; // take into consideration only object's own properties.
      if (prop in target) { // handling merging of two properties with equal names
        if (typeof target[prop] !== 'object') {
          target[prop] = source[prop];
        } else {
          if (typeof source[prop] !== 'object') {
            target[prop] = source[prop];
          } else {
            if (target[prop].concat && source[prop].concat) { // two arrays get concatenated
              target[prop] = target[prop].concat(source[prop]);
            } else { // two objects get merged recursively
              target[prop] = deepMerge(target[prop], source[prop]); 
            } 
          }  
        }
      } else { // new properties get added to target
        target[prop] = source[prop]; 
      }
    }
    return target;
}

/**
 * Gets the plural form of a model
 * @param {*} entry 
 */
function plural(entry) {
    if (entry.name) {
        entry = entry.name;
    }
    if (entry.substring(entry.length - 1) != 's') {
        entry += 's';
    }
    return entry;
}
