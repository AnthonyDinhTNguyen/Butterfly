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
    this.shapes.box.draw(graphics_state, m.times(Mat4.scale(Vec.of(5, 1, 1))), this.plastic.override({color: this.yellow}));
  }
  drawhead(graphics_state,m){
    let C = m.times(Mat4.translation(Vec.of(7,0,0)));
    let M = C.times(Mat4.scale(Vec.of(2,2,2)));
    this.shapes.ball.draw(graphics_state,M,this.plastic.override({color: this.blue}));
  }
  drawabdomen(graphics_state,m){
    let C = m.times(Mat4.translation(Vec.of(-8,0,0)));
    let M = C.times(Mat4.scale(Vec.of(3,1,1)));
    this.shapes.ball.draw(graphics_state,M,this.plastic.override({color:this.blue}));
  }
  drawwing(graphics_state,m,side,side2){
    let wing = m.times(Mat4.rotation(side2*.7*Math.sin(this.t),Vec.of(1,0,0)));
    wing = wing.times(Mat4.translation(Vec.of(0,1/4,side2*5)));
    let C = wing.times(Mat4.rotation(Math.PI/2,Vec.of(1,0,0)));//rotate coordinate system to align with thorax
    C=C.times(Mat4.rotation(side*Math.PI/4,Vec.of(0,0,1)));
    
    let T=C.times(Mat4.scale(Vec.of(5*Math.sqrt(2),5*Math.sqrt(2),1/4)));//scale triangle to align with thorax
    this.shapes.prism.draw(graphics_state,T,this.plastic.override({color: this.blue}));
    
    let B=C.times(Mat4.translation(Vec.of(side2*(5/2)*Math.sqrt(2),side2*(-5/2)*Math.sqrt(2),0)));//draw back box of wing reusing coordinate system C
    B =B.times(Mat4.scale(Vec.of(5/2*Math.sqrt(2),5/2*Math.sqrt(2),1/4)));
    this.shapes.box.draw(graphics_state,B,this.plastic.override({color: this.yellow}));
    
    let F = C.times(Mat4.translation(Vec.of(side2*(-5/2)*Math.sqrt(2),side2*(5/2)*Math.sqrt(2),0)));//draw front of wing using coordinate system C
    F = F.times(Mat4.scale(Vec.of((5/2)*Math.sqrt(2),(5/2)*Math.sqrt(2),1/4)));
    this.shapes.box.draw(graphics_state,F,this.plastic.override({color: this.yellow}));
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

    // TODO: Replace the below example code with your own code to draw the butterfly.
    /*this.shapes.ball.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(10 * Math.sin(t), 5 * Math.sin(2 * t), 0))),
            this.plastic.override({color: this.blue}));
        this.shapes.box.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(-5, 0, 0))).times(Mat4.rotation(t, Vec.of(0, 1, 0))),
            this.clay.override({color: this.yellow}));
        this.shapes.prism.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(5, -1, 0))).times(Mat4.rotation(t, Vec.of(0, 1, 0))).times(Mat4.scale(Vec.of(2, 2, 1))),
            this.plastic.override({color: this.yellow}));*/
    this.drawthorax(graphics_state,m);
    this.drawhead(graphics_state,m);
    this.drawabdomen(graphics_state,m);
    let wing1 = m.times(Mat4.translation(Vec.of(0,1,1)));
    this.drawwing(graphics_state,wing1,-3,1);
    let wing2 = m.times(Mat4.translation(Vec.of(0,1,-1))); 
    this.drawwing(graphics_state,wing2,1,-1);
  }
}

window.Assignment_One_Scene = window.classes.Assignment_One_Scene = Assignment_One_Scene;
