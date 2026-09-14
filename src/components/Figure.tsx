import { neutralConfig, resolveAngles, SEG } from '../domain/figures'
import type { Pose, PositionKind } from '../domain/types'

interface FigureProps {
  position: PositionKind
  pose: Pose
  ghost?: boolean
}

interface ArmProps {
  variant: 'near' | 'far'
  shoulder: number
  elbow: number
}

/** 手臂：肩关节组嵌套肘关节组，CSS transition 驱动旋转动画 */
function Arm({ variant, shoulder, elbow }: ArmProps) {
  const off = variant === 'near' ? 2.5 : -2.5
  return (
    <g
      className={`joint arm ${variant}`}
      style={{ transform: `translate(${off}px, ${-SEG.torso + 3}px) rotate(${shoulder}deg)` }}
    >
      <line x1={0} y1={0} x2={0} y2={-SEG.upperArm} className="bone" />
      <g
        className="joint forearm"
        style={{ transform: `translate(0px, ${-SEG.upperArm}px) rotate(${elbow}deg)` }}
      >
        <line x1={0} y1={0} x2={0} y2={-SEG.forearm} className="bone" />
        <circle cx={0} cy={-SEG.forearm - 2.5} r={3} className="extremity" />
      </g>
    </g>
  )
}

interface LegProps {
  variant: 'near' | 'far'
  hip: number
  knee: number
}

function Leg({ variant, hip, knee }: LegProps) {
  const off = variant === 'near' ? 2.5 : -2.5
  return (
    <g
      className={`joint leg ${variant}`}
      style={{ transform: `translate(${off}px, 0px) rotate(${hip}deg)` }}
    >
      <line x1={0} y1={0} x2={0} y2={-SEG.thigh} className="bone" />
      <g
        className="joint shank"
        style={{ transform: `translate(0px, ${-SEG.thigh}px) rotate(${knee}deg)` }}
      >
        <line x1={0} y1={0} x2={0} y2={-SEG.shank} className="bone" />
        <line x1={0} y1={-SEG.shank} x2={11} y2={-SEG.shank} className="bone foot" />
      </g>
    </g>
  )
}

/** 地面 / 椅子 / 瑜伽垫等环境道具 */
function Prop({ position }: { position: PositionKind }) {
  const cfg = neutralConfig(position)
  const g = cfg.groundY
  if (position === 'seated') {
    const hx = cfg.hip.x
    return (
      <g className="prop">
        <line x1={hx - 32} y1={cfg.hip.y + 2} x2={hx + 34} y2={cfg.hip.y + 2} />
        <line x1={hx - 32} y1={cfg.hip.y + 2} x2={hx - 32} y2={cfg.hip.y - 44} />
        <line x1={hx - 28} y1={cfg.hip.y + 2} x2={hx - 28} y2={g} />
        <line x1={hx + 30} y1={cfg.hip.y + 2} x2={hx + 30} y2={g} />
        <line x1={30} y1={g} x2={190} y2={g} className="ground" />
      </g>
    )
  }
  const cls = position === 'standing' ? 'ground' : 'mat'
  return (
    <g className="prop">
      <line x1={24} y1={g} x2={196} y2={g} className={cls} />
    </g>
  )
}

/**
 * 参数化 SVG 小人（侧面视图，面朝右）。
 * 关节组嵌套，旋转通过 CSS transition 在起止姿势间过渡。
 */
export function Figure({ position, pose, ghost = false }: FigureProps) {
  const cfg = neutralConfig(position)
  const a = resolveAngles(position, pose)
  return (
    <g className={ghost ? 'figure ghost' : 'figure'}>
      <Prop position={position} />
      <g
        className="joint root"
        style={{
          transform: `translate(${cfg.hip.x}px, ${cfg.hip.y}px) rotate(${cfg.rootRotate}deg)`,
        }}
      >
        <Leg variant="far" hip={a.hipR} knee={a.kneeR} />
        <Leg variant="near" hip={a.hipL} knee={a.kneeL} />
        <g className="joint torso" style={{ transform: `rotate(${a.torso}deg)` }}>
          <line x1={0} y1={0} x2={0} y2={-SEG.torso} className="bone torso-bone" />
          <Arm variant="far" shoulder={a.shoulderR - a.torso} elbow={a.elbowR - a.shoulderR} />
          <g
            className="joint neck"
            style={{ transform: `translate(0px, ${-SEG.torso}px) rotate(${a.neck - a.torso}deg)` }}
          >
            <line x1={0} y1={0} x2={0} y2={-SEG.neck} className="bone" />
            <circle cx={0} cy={-(SEG.neck + SEG.headR - 2)} r={SEG.headR} className="head" />
            <line
              x1={4}
              y1={-(SEG.neck + SEG.headR - 2)}
              x2={SEG.headR + 3}
              y2={-(SEG.neck + SEG.headR - 2)}
              className="face-tick"
            />
          </g>
          <Arm variant="near" shoulder={a.shoulderL - a.torso} elbow={a.elbowL - a.shoulderL} />
        </g>
      </g>
    </g>
  )
}
