// Helper to move "All others" subcategory to the end of an array
export const moveAllOthersToEnd = (arr, key = 'sub_category_name') => {
  const allOthersIndex = arr.findIndex(item => 
    item[key]?.toLowerCase() === 'all others'
  );
  
  if (allOthersIndex > -1) {
    const [allOthersItem] = arr.splice(allOthersIndex, 1);
    arr.push(allOthersItem);
  }
  
  return arr;
};
