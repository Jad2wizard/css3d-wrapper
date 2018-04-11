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
![Alt text](https://github.com/Jad2Wizard/css3d-wrapper/raw/master/screenshots/rotateCamera.png)
2. translate the camera on Z-axis through mouse-wheel
![Alt text](https://github.com/Jad2Wizard/css3d-wrapper/raw/master/screenshots/translateCameraZ.png)
3. move SubComponent on XY plane through dragging the SubComponent by left-mouse-btn
![Alt text](https://github.com/Jad2Wizard/css3d-wrapper/raw/master/screenshots/move.png)
4. click SubComponent and transform it to the center of container by left-mouse-btn
![Alt text](https://github.com/Jad2Wizard/css3d-wrapper/raw/master/screenshots/click.png)
5. support Grid and Overlap layout of SubComponents
![Alt text](https://github.com/Jad2Wizard/css3d-wrapper/raw/master/screenshots/grid.png)
![Alt text](https://github.com/Jad2Wizard/css3d-wrapper/raw/master/screenshots/overlap.png)
6. in the step above, all the SubComponents' normal vectors are fixed.
