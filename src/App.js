import React from 'react'
import { map } from 'lodash';
import { useMeasure } from 'react-use';
import {
  Circle,
  View,
} from 'react-paper-bindings'

const Node = (props) => {
  const { x = 0, y = 0 } = props;
  return (
    <Circle
      center={[ x, y ]}
      fillColor="#61DAFB"
      onPressMove={() => console.log('pressmove')}
      radius={40}
      {...props}
    />
  );
};

// TODO: move into state
const nodes = [{ x: 0, y: 0}, { x: 100, y: 100 }];

const App = () => {
  const [rootElementRef, { width, height }] = useMeasure();
  return (
    <div className="app" ref={rootElementRef}>
      <View width={width} height={height}>
        {map(nodes, (node) => (
          <Node {...node} />
        ))}
      </View>
    </div>
  );
};

export default App;
