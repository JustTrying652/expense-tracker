import Svg, { Polygon } from 'react-native-svg';
import { Dimensions } from 'react-native';
import { colors } from '../theme';

const { width } = Dimensions.get('window');
const TOOTH = 14; // width of each zigzag tooth

interface Props {
  fill?: string;
  height?: number;
}

export default function ZigzagEdge({ fill = colors.ink, height = 16 }: Props) {
  const teeth = Math.ceil(width / TOOTH);
  const points: string[] = ['0,0'];

  for (let i = 0; i <= teeth; i++) {
    const x = i * TOOTH;
    const y = i % 2 === 0 ? height : 0;
    points.push(`${x},${y}`);
  }
  points.push(`${width},0`);

  return (
    <Svg width={width} height={height} style={{ marginTop: -1 }}>
      <Polygon points={points.join(' ')} fill={fill} />
    </Svg>
  );
}