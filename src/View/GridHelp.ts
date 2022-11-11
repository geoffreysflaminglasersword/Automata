function getRowsCount(items:any, cols:any) {
    const getItemsMaxHeight = items.map((val:any) => {
      const item = val[cols];
  
      return (item && item.y) + (item && item.h) || 0;
    });
  
    return Math.max(...getItemsMaxHeight, 1);
  }


    export function getContainerHeight(items:any, yPerPx:any, cols:any) {
        return getRowsCount(items, cols) * yPerPx;
      }
    
      function makeItem(item:any) {
      const { min = { w: 1, h: 1 }, max } = item;
      return {
        fixed: false,
        resizable: !item.fixed,
        draggable: !item.fixed,
        customDragger: false,
        customResizer: false,
        min: {
          w: Math.max(1, min.w),
          h: Math.max(1, min.h),
        },
        max: { ...max },
        ...item,
      };
    }
    
    
    
    
    export function getItemById(id:any, items:any) {
      return items.find((value:any) => value.id === id);
    }
    
     function findFreeSpaceForItem(matrix:any, item:any) {
      const cols = matrix[0].length;
      const w = Math.min(cols, item.w);
      let xNtime = cols - w;
      let getMatrixRows = matrix.length;
    
      for (var i = 0; i < getMatrixRows; i++) {
        const row = matrix[i];
        for (var j = 0; j < xNtime + 1; j++) {
          const sliceA = row.slice(j, j + w);
          const empty = sliceA.every((val:any) => val === undefined);
          if (empty) {
            const isEmpty = matrix.slice(i, i + item.h).every((a:any) => a.slice(j, j + w).every((n:any) => n === undefined));
    
            if (isEmpty) {
              return { y: i, x: j };
            }
          }
        }
      }
    
      return {
        y: getMatrixRows,
        x: 0,
      };
    }
    
    const getItem = (item:any, col:any) => {
      return { ...item[col], id: item.id };
    };
    
    const updateItem = (elements:any, active:any, position:any, col:any) => {
      return elements.map((value:any) => {
        if (value.id === active.id) {
          return { ...value, [col]: { ...value[col], ...position } };
        }
        return value;
      });
    };
    
    export function moveItemsAroundItem(active:any, items:any, cols:any, original:any) {
      // Get current item from the breakpoint
      const activeItem = getItem(active, cols);
      const ids = items.map((value:any) => value.id).filter((value:any) => value !== activeItem.id);
    
      const els = items.filter((value:any) => value.id !== activeItem.id);
    
      // Update items
      let newItems = updateItem(items, active, activeItem, cols);
    
      let matrix = makeMatrixFromItemsIgnore(newItems, ids, getRowsCount(newItems, cols), cols);
      let tempItems = newItems;
    
      // Exclude resolved elements ids in array
      let exclude:any[] = [];
    
      els.forEach((item:any) => {
        // Find position for element
        let position = findFreeSpaceForItem(matrix, item[cols]);
        // Exclude item
        exclude.push(item.id);
    
        tempItems = updateItem(tempItems, item, position, cols);
    
        // Recreate ids of elements
        let getIgnoreItems = ids.filter((value:any) => exclude.indexOf(value) === -1);
    
        // Update matrix for next iteration
        matrix = makeMatrixFromItemsIgnore(tempItems, getIgnoreItems, getRowsCount(tempItems, cols), cols);
      });
    
      // Return result
      return tempItems;
    }
    
     
    
     function getUndefinedItems(items:any, col:any, breakpoints:any) {
      return items
        .map((value:any) => {
          if (!value[col]) {
            return value.id;
          }
        })
        .filter(Boolean);
    }
    
     function getClosestColumn(items:any, item:any, col:any, breakpoints:any) {
      return breakpoints
        .map(([_, column]:any) => item[column] && column)
        .filter(Boolean)
        .reduce(function (acc:any, value:any) {
          const isLower = Math.abs(value - col) < Math.abs(acc - col);
    
          return isLower ? value : acc;
        });
    }
    
     export function specifyUndefinedColumns(items:any, col:any, breakpoints:any) {
      let matrix = makeMatrixFromItems(items, getRowsCount(items, col), col);
    
      const getUndefinedElements = getUndefinedItems(items, col, breakpoints);
    
      let newItems = [...items];
    
      getUndefinedElements.forEach((elementId:any) => {
        const getElement = items.find((item:any) => item.id === elementId);
    
        const closestColumn = getClosestColumn(items, getElement, col, breakpoints);
    
        const position = findFreeSpaceForItem(matrix, getElement[closestColumn]);
    
        const newItem = {
          ...getElement,
          [col]: {
            ...getElement[closestColumn],
            ...position,
          },
        };
    
        newItems = newItems.map((value) => (value.id === elementId ? newItem : value));
    
        matrix = makeMatrixFromItems(newItems, getRowsCount(newItems, col), col);
      });
      return newItems;
    }
    
    
    
    
     const makeMatrix = (rows:any, cols:any) => Array.from(Array(rows), () => new Array(cols)); // make 2d array
    
     function makeMatrixFromItems(items:any, _row:any, _col:any) {
      let matrix = makeMatrix(_row, _col);
    
      for (var i = 0; i < items.length; i++) {
        const value = items[i][_col];
        if (value) {
          const { x, y, h } = value;
          const id = items[i].id;
          const w = Math.min(_col, value.w);
    
          for (var j = y; j < y + h; j++) {
            const row = matrix[j];
            for (var k = x; k < x + w; k++) {
              row[k] = { ...value, id };
            }
          }
        }
      }
      return matrix;
    }
    
     function findCloseBlocks(items:any, matrix:any, curObject:any) {
      const { h, x, y } = curObject;
    
      const w = Math.min(matrix[0].length, curObject.w);
      const tempR = matrix.slice(y, y + h);
    
      let result:any[] = [];
      for (var i = 0; i < tempR.length; i++) {
        let tempA = tempR[i].slice(x, x + w);
        result = [...result, ...tempA.map((val:any) => val.id && val.id !== curObject.id && val.id).filter(Boolean)];
      }
    
      return [...new Set(result)];
    }
    
     function makeMatrixFromItemsIgnore(items:any, ignoreList:any, _row:any, _col:any) {
      let matrix = makeMatrix(_row, _col);
      for (var i = 0; i < items.length; i++) {
        const value = items[i][_col];
        const id = items[i].id;
        const { x, y, h } = value;
        const w = Math.min(_col, value.w);
    
        if (ignoreList.indexOf(id) === -1) {
          for (var j = y; j < y + h; j++) {
            const row = matrix[j];
            if (row) {
              for (var k = x; k < x + w; k++) {
                row[k] = { ...value, id };
              }
            }
          }
        }
      }
      return matrix;
    }
    
     function findItemsById(closeBlocks:any, items:any) {
      return items.filter((value:any) => closeBlocks.indexOf(value.id) !== -1);
    }
 
 export function moveItem(active:any, items:any, cols:any, original:any) {
    // Get current item from the breakpoint
    const item = getItem(active, cols);
  
    // Create matrix from the items expect the active
    let matrix = makeMatrixFromItemsIgnore(items, [item.id], getRowsCount(items, cols), cols);
    // Getting the ids of items under active Array<String>
    const closeBlocks = findCloseBlocks(items, matrix, item);
    // Getting the objects of items under active Array<Object>
    let closeObj = findItemsById(closeBlocks, items);
    // Getting whenever of these items is fixed
    const fixed = closeObj.find((value:any) => value[cols].fixed);
  
    // If found fixed, reset the active to its original position
    if (fixed) return items;
  
    // Update items
    items = updateItem(items, active, item, cols);
  
    // Create matrix of items expect close elements
    matrix = makeMatrixFromItemsIgnore(items, closeBlocks, getRowsCount(items, cols), cols);
  
    // Create temp vars
    let tempItems = items;
    let tempCloseBlocks = closeBlocks;
  
    // Exclude resolved elements ids in array
    let exclude:any[] = [];
  
    // Iterate over close elements under active item
    closeObj.forEach((item:any) => {
      // Find position for element
      let position = findFreeSpaceForItem(matrix, item[cols]);
      // Exclude item
      exclude.push(item.id);
  
      // Assign the position to the element in the column
      tempItems = updateItem(tempItems, item, position, cols);
  
      // Recreate ids of elements
      let getIgnoreItems = tempCloseBlocks.filter((value) => exclude.indexOf(value) === -1);
  
      // Update matrix for next iteration
      matrix = makeMatrixFromItemsIgnore(tempItems, getIgnoreItems, getRowsCount(tempItems, cols), cols);
    });
  
    // Return result
    return tempItems;
  }
  
  // Helper function
  function normalize(items:any, col:any) {
    let result = items.slice();
  
    result.forEach((value:any) => {
      const getItem = value[col];
      if (!getItem.static) {
        result = moveItem(getItem, result, col, { ...getItem });
      }
    });
  
    return result;
  }
  
  // Helper function
   function adjust(items:any, col:any) {
    let matrix = makeMatrix(getRowsCount(items, col), col);
  
    let res:any[] = [];
  
    items.forEach((item:any) => {
      let position = findFreeSpaceForItem(matrix, item[col]);
  
      res.push({
        ...item,
        [col]: {
          ...item[col],
          ...position,
        },
      });
  
      matrix = makeMatrixFromItems(res, getRowsCount(res, col), col);
    });
  
    return res;
  }
  
  export const gridHelp = {
    normalize(items:any, col:any) {
      const rows = getRowsCount(items, col);
      return normalize(items, col);
    },
  
    adjust(items:any, col:any) {
      return adjust(items, col);
    },
  
    item(obj:any) {
      return makeItem(obj);
    },
  
    findSpace(item:any, items:any, cols:any) {
      let matrix = makeMatrixFromItems(items, getRowsCount(items, cols), cols);
  
      let position = findFreeSpaceForItem(matrix, item[cols]);
      return position;
    },
  };
  