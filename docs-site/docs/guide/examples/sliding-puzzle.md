# Sliding puzzle
This example features:
- A custom responsive layout that adapts to screen width and maintains a 3 x 3 grid
- Tile dragging and repositioning with custom rules.  A tile can only be moved to the empty position.  No resizing allowed
- A mix of static/nonstatic draggable/nondraggable items
- max rows - ensuring the square - positioning items within the limits

# ToDO
- Figure out how to ensure the max rows - it only works for dragging and resizing atm
- Potentially add a new option for "Drag behaviour" which would determine what would happen to items around the item being dragged.  Does it swap the item with what you're dragging?  Does it intelligently figure it out?  Probably better.  Does it only ever stack (like what it does now)

<ClientOnly>
  <SlidingPuzzle />
</ClientOnly>
