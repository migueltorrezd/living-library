/** Metre-based book mechanics. A damped binding hinge and an inextensible
 * developable paper strip. Segment angles bend; segment lengths never change.
 * This is an interactive reduced-order model, not a full cloth simulation.
 */
export class BookHinge {
  angle = 0;
  velocity = 0;
  readonly inertia: number;
  readonly stiffness: number;
  readonly damping: number;
  constructor(width: number, height: number, board: number) {
    const mass = width * height * board * 750;
    this.inertia = Math.max(1e-8, mass * width ** 2 / 3);
    this.stiffness = Math.max(.00004, height * board * 16);
    this.damping = 1.02 * 2 * Math.sqrt(this.stiffness * this.inertia);
  }
  step(target: number, elapsed: number) {
    target = Math.max(-2.78, Math.min(0, target));
    const steps = Math.max(1, Math.ceil(Math.min(elapsed, .05) * 480));
    const dt = Math.min(elapsed, .05) / steps;
    for (let i = 0; i < steps; i++) {
      this.velocity += ((target - this.angle) * this.stiffness - this.damping * this.velocity) / this.inertia * dt;
      this.angle += this.velocity * dt;
      if (this.angle > 0) { this.angle = 0; this.velocity = Math.min(0, this.velocity); }
      if (this.angle < -2.78) { this.angle = -2.78; this.velocity = Math.max(0, this.velocity); }
    }
    return this.angle;
  }
  snap(angle: number) { this.angle = angle; this.velocity = 0; }
}

export class PaperDynamics {
  readonly columns = 40;
  readonly rows = 12;
  readonly positions: Float64Array;
  private readonly angles: Float64Array;
  private readonly velocities: Float64Array;
  private readonly drive: BookHinge;
  readonly width: number;
  readonly height: number;
  readonly restLift: number;
  readonly restCurl: number;
  readonly turnAngle:number;
  readonly coverClearance:number;
  readonly binding?:{dx:number;dz:number;board:number};
  readonly turnedCenter=[0,0,0];
  private readonly seatedAngles:Float64Array;
  angle = 0;
  constructor(width: number, height: number, coverClearance = Infinity,binding?:{dx:number;dz:number;board:number}) {
    this.coverClearance=coverClearance;this.binding=binding;
    this.width = width; this.height = height;
    // Leave room for the sheet's thickness and its printed face inside the case.
    const rise = Math.max(.00001, coverClearance - .000105 - .000015);
    this.restLift = Math.min(.00012, rise * .2);
    this.restCurl = Math.min(.025, (rise - this.restLift) * 12 / width * .9);
    this.positions = new Float64Array((this.columns + 1) * (this.rows + 1) * 3);
    this.angles = new Float64Array(this.columns);
    this.velocities = new Float64Array(this.columns);
    this.seatedAngles=new Float64Array(this.columns);
    this.turnAngle=binding?-2.75:-2.48;
    this.drive = new BookHinge(width, height, .0001);
    this.contactAngles(this.turnAngle,this.seatedAngles);
    this.angles.set(this.seatedAngles);this.constrainCover(this.turnAngle);this.seatedAngles.set(this.angles);this.rebuild();this.sample(.5,.5,this.turnedCenter);
    this.snap(false);
  }
  /** The spine attachment stays fixed while a short gutter bend meets the board. */
  private contactAngles(cover:number,output:Float64Array){
    if(!this.binding){for(let i=0;i<this.columns;i++)output[i]=cover+Math.max(0,-cover-.65)*Math.exp(-(i+.5)/this.columns*24);return;}
    const {dx,dz,board}=this.binding,segment=this.width/this.columns;
    const origin=Math.sin(cover)*dx+Math.cos(cover)*(dz+this.restLift),plane=-board/2-.00035;
    let low=-1.4,high=1.4;
    for(let n=0;n<40;n++){
      const bend=(low+high)/2;let distance=origin;
      for(let i=0;i<this.columns;i++)distance-=Math.sin(bend*Math.exp(-(i+.5)*segment/.0028))*segment;
      if(distance>plane)low=bend;else high=bend;
    }
    const bend=(low+high)/2;
    for(let i=0;i<this.columns;i++)output[i]=Math.min(0,Math.max(-Math.PI+.001,cover+bend*Math.exp(-(i+.5)*segment/.0028)));
  }
  private constrainCover(cover:number){
    if(!this.binding||cover>-2)return;
    const {dx,dz,board}=this.binding,c=Math.cos(cover),s=Math.sin(cover),segment=this.width/this.columns,plane=-board/2-.00035;
    let x=0,z=this.restLift;
    for(let i=0;i<this.columns;i++){
      let angle=this.angles[i],nx=x+Math.cos(angle)*segment,nz=z-Math.sin(angle)*segment;
      const u=c*(nx+dx)-s*(nz+dz),distance=s*(nx+dx)+c*(nz+dz);
      if(u>.0001&&u<this.width+.003&&distance>plane){
        const start=s*(x+dx)+c*(z+dz),ratio=Math.max(-1,Math.min(1,(plane-start)/segment));
        angle=Math.max(-Math.PI+.001,Math.min(0,cover-Math.asin(ratio)));
        this.angles[i]=angle;this.velocities[i]=Math.max(0,this.velocities[i]);
        nx=x+Math.cos(angle)*segment;nz=z-Math.sin(angle)*segment;
      }
      x=nx;z=nz;
    }
  }
  private rebuild() {
    let x = 0, z = this.restLift;
    for (let column = 0; column <= this.columns; column++) {
      for (let row = 0; row <= this.rows; row++) {
        const k = (row * (this.columns + 1) + column) * 3;
        this.positions[k] = x;
        this.positions[k + 1] = (row / this.rows - .5) * this.height;
        this.positions[k + 2] = z;
      }
      if (column < this.columns) {
        x += Math.cos(this.angles[column]) * this.width / this.columns;
        z -= Math.sin(this.angles[column]) * this.width / this.columns;
      }
    }
  }
  step(elapsed: number, turned: boolean, cover: number) {
    // The reader lifts the free edge only after the rigid cover has cleared it.
    const destination = turned && cover < -2.68 ? this.turnAngle : 0;
    this.angle = this.drive.step(destination, elapsed);
    const dt = Math.min(.05, elapsed);
    const substeps = Math.max(1, Math.ceil(dt * 240));
    const h = dt / substeps;
    const progress = Math.max(0, Math.min(1, this.angle / this.turnAngle));
    const curl = .58 * Math.sin(Math.PI * progress);
    const settle=Math.max(0,Math.min(1,(progress-.55)/.45)),contact=settle*settle*(3-2*settle);
    for (let step = 0; step < substeps; step++) {
      for (let i = 0; i < this.columns; i++) {
        const u = (i + .5) / this.columns;
        // A held free edge leads the turn; the stiff sheet follows with a broad bend.
        const liftedGutter=Math.max(0,-this.angle-.65)*Math.exp(-u*24);
        const gutter=this.binding?liftedGutter*(1-contact)+(this.seatedAngles[i]-this.turnAngle)*contact:liftedGutter;
        const rest = -this.restCurl * Math.exp(-12 * u) * (1 - progress);
        const floor=this.binding?-Math.PI+.001:Math.min(-.03,cover+.16);
        const target = Math.max(floor, Math.min(0, this.angle + gutter + curl * Math.cos(Math.PI * u) + rest));
        const omega = 15 + u * 7;
        this.velocities[i] += ((target - this.angles[i]) * omega * omega - 2.05 * omega * this.velocities[i]) * h;
        this.angles[i] += this.velocities[i] * h;
        // Unilateral limits keep the paper above the block and inside the open cover.
        if (this.angles[i] < floor) { this.angles[i] = floor; this.velocities[i] = Math.max(0, this.velocities[i]); }
        if (this.angles[i] > 0) { this.angles[i] = 0; this.velocities[i] = Math.min(0, this.velocities[i]); }
      }
      this.constrainCover(cover);
    }
    this.rebuild();
  }
  snap(turned: boolean) {
    this.snapAngle(turned?this.turnAngle:0);
  }
  snapAngle(angle:number) {
    this.angle = Math.max(this.turnAngle,Math.min(0,angle));
    this.drive.snap(this.angle);
    if(this.binding&&this.angle<-.02)this.contactAngles(this.angle,this.angles);
    else for (let i = 0; i < this.columns; i++) this.angles[i] = this.angle + Math.max(0, -this.angle - .65) * Math.exp(-(i + .5) / this.columns * 24) - this.restCurl * Math.exp(-12 * (i + .5) / this.columns)*(1-this.angle/this.turnAngle);
    this.constrainCover(this.angle);this.velocities.fill(0); this.rebuild();
  }
  get atRest() { return Math.max(...this.angles.map((a, i) => Math.abs(a + this.restCurl * Math.exp(-12 * (i + .5) / this.columns)))) < .002 && Math.abs(this.drive.velocity) < .005; }
  get atTurnedRest() { return Math.max(...this.angles.map((a,i)=>Math.abs(a-this.seatedAngles[i])))<.003&&Math.abs(this.drive.velocity)<.005; }
  sample(u: number, v: number, output: number[], normal?: number[]) {
    const x = Math.max(0, Math.min(this.columns - 1e-8, u * this.columns));
    const i = Math.floor(x), t = x - i, a = i * 3;
    output[0] = this.positions[a] * (1 - t) + this.positions[a + 3] * t;
    output[1] = (v - .5) * this.height;
    output[2] = this.positions[a + 2] * (1 - t) + this.positions[a + 5] * t;
    if (normal) {
      const angle = this.angles[Math.min(this.columns - 1, i)];
      normal[0] = Math.sin(angle); normal[1] = 0; normal[2] = Math.cos(angle);
    }
  }
  maxStretch() {
    let maximum = 0;
    for (let i = 0; i < this.columns; i++) {
      const a = i * 3;
      const distance = Math.hypot(this.positions[a + 3] - this.positions[a], this.positions[a + 5] - this.positions[a + 2]);
      maximum = Math.max(maximum, Math.abs(distance / (this.width / this.columns) - 1));
    }
    return maximum;
  }
}
