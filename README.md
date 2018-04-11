# css3d-wrapper
> a React component which can add 3D effects on the children component, implemented by CSS3 transform
## Intall
  npm install css3d-wrapper
  
  ```
  import React from 'react';
  import CSS3D from 'css3d-wrapper';
  const Demo = () => (
    <CSS3D>
      <SubComponent1/>
      <SubComponent2/>
      <SubComponent3/>
      <SubComponent4/>
      <SubComponent5/>
    </CSS3D>
  )
  # Demo can add 3D effects on SubComponnet1 ~ SubComponent5.
 ```
## 3D Effects
1. rotate the camera around X-axis and Y-axis through dragging by left-mouse-btn
2. move SubComponent on XY plane through dragging the SubComponent by left-mouse-btn
3. click SubComponent and transform it to the center of container by left-mouse-btn
4. support Grid and Overlap layout of SubComponents
5. in the step above, all the SubComponents' normal vectors are fixed.
