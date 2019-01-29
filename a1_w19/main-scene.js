class Assignment_One_Scene extends Scene_Component {
  // The scene begins by requesting the camera, shapes, and materials it will need.
  constructor(context, control_box) {
    super(context, control_box);

    // First, include a secondary Scene that provides movement controls:
    if (!context.globals.has_controls)
      context.register_scene_component(new Movement_Controls(context,control_box.parentElement.insertCell()));

    // Locate the camera here (inverted matrix).
    const r = context.width / context.height;
    context.globals.graphics_state.camera_transform = Mat4.translation([0, 0, -35]);
    context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

    // At the beginning of our program, load one of each of these shape
    // definitions onto the GPU.  NOTE:  Only do this ONCE per shape
    // design.  Once you've told the GPU what the design of a cube is,
    // it would be redundant to tell it again.  You should just re-use
    // the one called "box" more than once in display() to draw
    // multiple cubes.  Don't define more than one blueprint for the
    // same thing here.
    const shapes = {
      'box': new Cube(),
      'ball': new Subdivision_Sphere(4),
      'prism': new TriangularPrism()
    }
    this.submit_shapes(context, shapes);

    // Make some Material objects available to you:
    this.clay = context.get_instance(Phong_Shader).material(Color.of(.9, .5, .9, 1), {
      ambient: .4,
      diffusivity: .4
    });
    this.plastic = this.clay.override({
      specularity: .6
    });

    this.lights = [new Light(Vec.of(10, 10, 20, 1),Color.of(1, .4, 1, 1),100000)];

    this.blue = Color.of(0, 0, 1, 1);
    this.yellow = Color.of(1, 1, 0, 1);

    this.t = 0;
  }

  // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
  make_control_panel() {
    this.key_triggered_button("Hover in Place", ["m"], ()=>{
      this.hover = !this.hover;
    }
    );
    this.key_triggered_button("Pause Time", ["n"], ()=>{
      this.paused = !this.paused;
    }
    );
  }
  drawthorax(graphics_state,m) {
    this.shapes.box.draw(graphics_state, m.times(Mat4.scale(Vec.of(5, 1, 1))), this.plastic.override({color: this.yellow}));//simple scaling of a box at the given coordinate system 
    //coordinate system m could be either the starting origin, or a translated/rotated coordinate system that simulates flying. Either way it does not matter, we do the scaling relative to the given coordinates
  }
  drawhead(graphics_state,m){
    let C = m.times(Mat4.translation(Vec.of(7,0,0)));
    C = C.times(Mat4.scale(Vec.of(2,2,2)));
    this.shapes.ball.draw(graphics_state,C,this.plastic.override({color: this.blue}));
  }
  drawabdomen(graphics_state,m){
    let C = m.times(Mat4.translation(Vec.of(-8,0,0)));
    let M = C.times(Mat4.scale(Vec.of(3,1,1)));
    this.shapes.ball.draw(graphics_state,M,this.plastic.override({color:this.blue}));
  }
  drawwing(graphics_state,m,Tparam,Bparam,Fparam){
    let wing = m.times(Mat4.rotation(Bparam*.7*Math.sin(this.t),Vec.of(1,0,0)));
    wing = wing.times(Mat4.translation(Vec.of(0,1/4,Bparam*5)));
    
    let CoordinateSystem = wing.times(Mat4.rotation(Math.PI/2,Vec.of(1,0,0)));//rotate coordinate system to align with thorax
    CoordinateSystem=CoordinateSystem.times(Mat4.rotation(Tparam*Math.PI/4,Vec.of(0,0,1)));// continue rotation.
    
    let TriangleSection=CoordinateSystem.times(Mat4.scale(Vec.of(5*Math.sqrt(2),5*Math.sqrt(2),1/4)));//scale triangle to align with thorax
    this.shapes.prism.draw(graphics_state,TriangleSection,this.plastic.override({color: this.blue}));
    
    let BackOfWing=CoordinateSystem.times(Mat4.translation(Vec.of(Bparam*(5/2)*Math.sqrt(2),Bparam*(-5/2)*Math.sqrt(2),0)));//draw back box of wing reusing coordinate system C
    BackOfWing =BackOfWing.times(Mat4.scale(Vec.of(5/2*Math.sqrt(2),5/2*Math.sqrt(2),1/4)));
    this.shapes.box.draw(graphics_state,BackOfWing,this.plastic.override({color: this.yellow}));
    
    let FrontOfWing = CoordinateSystem.times(Mat4.translation(Vec.of(Fparam*Bparam*(-5/4)*Math.sqrt(2),(1/Fparam)*Bparam*(15/4)*Math.sqrt(2),0)));//draw front of wing using coordinate system C
    FrontOfWing = FrontOfWing.times(Mat4.scale(Vec.of((15/4)*Math.sqrt(2),(15/4)*Math.sqrt(2),1/4)));
    this.shapes.box.draw(graphics_state,FrontOfWing,this.plastic.override({color: this.yellow}));
  }

  drawlegs(graphics_state,m,side){
    let M = m.times(Mat4.rotation(side*(-.2)*Math.sin(this.t*.5),Vec.of(1,0,0)));//animate top leg
    let Ltop = M.times(Mat4.rotation(side*(-0.5),Vec.of(1,0,0)));//set base angle of top leg
    Ltop = Ltop.times(Mat4.translation(Vec.of(0,-1,side*(.5))));//translate top leg to align with thorax
    let Lbottom=Ltop.times(Mat4.translation(Vec.of(0,-1,side*(-.5))));//translate coordinate system with respect to the top leg coordinate system - get the axis of rotation on the corner of top leg
    Lbottom=Lbottom.times(Mat4.rotation(side*Math.abs(side*(-.2)*Math.sin(this.t*.5)),Vec.of(1,0,0)));//rotate along the corner of top leg
    Lbottom=Lbottom.times(Mat4.translation(Vec.of(0,-1,side*(.5))));//translate bottom to match corner to corner with top leg/axis of rotation corner
    Ltop= Ltop.times(Mat4.scale(Vec.of(1/2,1,1/2)));//scale top and bottom leg
    Lbottom= Lbottom.times(Mat4.scale(Vec.of(1/2,1,1/2)));
    this.shapes.box.draw(graphics_state,Ltop,this.plastic.override({color: this.blue}));
    this.shapes.box.draw(graphics_state,Lbottom,this.plastic.override({color: this.yellow}));
  }
  drawantball(graphics_state,MM){//draw the ball at the end of the antennae
    let B = MM.times(Mat4.translation(Vec.of(1,0,0)));//translate the ball with respect to the coordinate system of the last cube on the antennae stack (center of ball on edge of top box)
    B = B.times(Mat4.scale(Vec.of(2,2,2)));//scale the ball
    B = B.times(Mat4.translation(Vec.of(1,0,0)));//translate the ball with respect to the new scaling so it is tangent to the antennae cube
    this.shapes.ball.draw(graphics_state,B,this.plastic.override({color: this.yellow}));
  }
  drawantstack(graphics_state,M){//draw the cubes of the antennae with respect to the base cube antennae coordinate system
    let i = 0;
    let MM = M;//iteratively transform this coordinate system(the coordinate system of the base cube of antennae) through each iteration of the for loop
    for(i = 0;i<8;i++){
    MM = MM.times(Mat4.translation(Vec.of(1,-1,0)));
    MM = MM.times(Mat4.scale(Vec.of(2,2,2)));
    MM=MM.times(Mat4.rotation(-Math.abs(.2*Math.sin(this.t*.25)),Vec.of(0,0,1)));
    MM=MM.times(Mat4.scale(Vec.of(1/2,1/2,1/2)));
    MM=MM.times(Mat4.translation(Vec.of(1,1,0)));
    this.shapes.box.draw(graphics_state,MM,this.plastic.override({color:this.yellow}));
    }
    this.drawantball(graphics_state,MM);
  }
  drawant(graphics_state,m,side){//draw base cube of each antennae then call helper functions for the rest
    let M = m.times(Mat4.rotation(side*(40*Math.PI/180),(Vec.of(0,1,0))));
    M = M.times(Mat4.rotation(40*Math.PI/180,Vec.of(0,0,1)));
    M=M.times(Mat4.translation(Vec.of(2,0,0)));
    M=M.times(Mat4.scale(Vec.of(1/4,1/4,1/4)));
    M=M.times(Mat4.translation(Vec.of(1,0,0)));
    this.shapes.box.draw(graphics_state,M,this.plastic.override({color:this.yellow}));
    this.drawantstack(graphics_state,M);//draw rest of antennae with respect to base cube coordinate system M
  }

  display(graphics_state) {
    // Use the lights stored in this.lights.
    graphics_state.lights = this.lights;

    // Variable m will be a temporary matrix that helps us draw most shapes.
    // It starts over as the identity every single frame - coordinate axes at the origin.
    let m = Mat4.identity();

    // Find how much time has passed in seconds, and use that to place shapes.
    if (!this.paused)
      this.t += graphics_state.animation_delta_time / 1000;
    const t = this.t;
    
    let fly = !this.hover;
    if(fly){//rotate and translate the coordinate system to go around the y axis. 
    m=m.times(Mat4.rotation(this.t,Vec.of(0,1,0)));
    m = m.times(Mat4.rotation(30*Math.PI/180,Vec.of(0,0,1)));
    m = m.times(Mat4.translation(Vec.of(0,20*Math.sin(this.t),0)));
    m =m.times(Mat4.translation(Vec.of(0,0,30)));
    }
    this.drawthorax(graphics_state,m);

    this.drawhead(graphics_state,m);
    
    this.drawabdomen(graphics_state,m);
    
    let wing1 = m.times(Mat4.translation(Vec.of(0,1,1)));//starting point for wing 1
    this.drawwing(graphics_state,wing1,-3,1,3);//the third constant is to help the function orient the wings the right way depending on the side
    let wing2 = m.times(Mat4.translation(Vec.of(0,1,-1))); //starting point for wing 2
    this.drawwing(graphics_state,wing2,1,-1,1);
    
    let leg1 = m.times(Mat4.translation(Vec.of(0,-1,1)));//starting point for each leg on the right side. 
    let leg2 = m.times(Mat4.translation(Vec.of(3,-1,1)));
    let leg3 = m.times(Mat4.translation(Vec.of(-3,-1,1)));
    this.drawlegs(graphics_state,leg1,1);//third constant tells the function this is right leg
    this.drawlegs(graphics_state,leg2,1);
    this.drawlegs(graphics_state,leg3,1);
    let leg4 = m.times(Mat4.translation(Vec.of(0,-1,-1)));//starting point for each leg on the left side. 
    let leg5 = m.times(Mat4.translation(Vec.of(3,-1,-1)));
    let leg6 = m.times(Mat4.translation(Vec.of(-3,-1,-1)));
    this.drawlegs(graphics_state,leg4,-1);//third constant tells the function this is the left leg
    this.drawlegs(graphics_state,leg5,-1);
    this.drawlegs(graphics_state,leg6,-1);
    
    let ant = m.times(Mat4.translation(Vec.of(7,0,0)));//starting point for antennae - center of the head
    this.drawant(graphics_state,ant,1);//third constant for left antennae
    this.drawant(graphics_state,ant,-1);//third constant for left antennae
  }
}

window.Assignment_One_Scene = window.classes.Assignment_One_Scene = Assignment_One_Scene;
