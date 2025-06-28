perimeter_offset = 6;
shell_offset = 3;

module outline() {
  include <right-test.scad>;
}

module outline_offset(offset=1) {
  minkowski() {
    hull() {
      outline();
    }
    sphere(r=offset);
  }     
}

module outline_perimeter() {
    outline_offset(perimeter_offset);
}

module outline_outer() {
  outline_offset(shell_offset);
}

module outline_outer_gap() {
  outline_offset(shell_offset-0.3);
}

module outline_inner() {
  outline_offset(1.53); 
}

module outline_outer_cut() {
    difference() {
        outline_outer();
      translate([0, 0, -100 + 5])
        cube([200, 200, 200], center = true);   
    }
}



module cover_shell() {
  difference() {
    outline_outer();
    outline_inner();
    translate([0, 0, -100 + 5])
      cube([200, 200, 200], center = true);   

  }
}

module perimeter_2d_projection() {
  difference() {
    projection() {
      intersection() {
        outline_perimeter();
        cube([200, 200, 1], center = true);
      }
    }
    projection() {
      intersection() {
        outline_inner();
        cube([200, 200, 1], center = true);
      }
    }
  } 
}

module perimeter() {
  difference() {
    translate([0, 0, -7]) {
      linear_extrude(height=10) {
        perimeter_2d_projection();
      }
    }
    translate([0, 0, -5]) {
      outline_outer_cut();
    }
  }
  
  translate([0, 0, -9]) {
    linear_extrude(height=2) {
      difference() {
        projection() {
          intersection() {
            outline_perimeter();
            cube([200, 200, 1], center = true);
          }
        }

        projection() {
          intersection() {
            outline_outer();
            cube([200, 200, 1], center = true);
          }
        }
      }
    }
  }
}


module perimeter_left() {
   
  scale([1, 1, -1]) { 
    union() {  
      difference() {
        translate([0, 0, -7]) {
          linear_extrude(height=10) {
            perimeter_2d_projection();
          }
        }
        translate([0, 0, -5]) {
          outline_outer_cut();
        }
      }
  
      translate([0, 0, -9]) {
        linear_extrude(height=2) {
          difference() {
            projection() {
              intersection() {
                outline_outer_gap();
                cube([200, 200, 1], center = true);
              }
            }

            projection() {
              intersection() {
                outline_inner();
                cube([200, 200, 1], center = true);
              }
            }
          }
        }  
      }
    }
  }
}

module latch() {
    
  cube([30, 1, 10], center = true);
  
  translate([0, -4, -2]) {
        difference() {
           minkowski() {
             cube([11, 9, 4], center = true);
             sphere(r=0.5, $fn=30); 
           }
          translate([0, -1, 2.5]) {
  rotate([0, 90, 0])
    cylinder(r=2.5, h=20, center = true, $fn=50);
          }
      }
    }
}


module latch_left() {
   
  scale([1, -1, 1]) 
  union() {
  cube([30, 1, 10], center = true);

  translate([0, 8.5/2+1/2, 0])
  cube([8.5, 8.5, 9.5], center = true);

  translate([0, 7, 0]) {
    rotate([0, 90, 0])
      cylinder(r=2.1, h=13, center = true, $fn=50);
  }    
  
  translate([0, 8, 0]) {
    rotate([0, 90, 0])
      cylinder(r=9/2, h=8.5, center = true, $fn=50);
  }    
  
  
  }
}

module latches() {
  translate([20, -77, -3])
    rotate([0,0,18.5])
      latch();
    
    
    translate([96, 10, -3])
    rotate([0,0,90])
      latch(); 
   
   translate([-25, 65, -3])
    rotate([0,0,-175.5])
      latch(); 
    
    translate([-70.6, -20, -3])
    rotate([0,0,-99])
      latch(); 
    
}


module latches_left() {
  z_offset = -2;
  translate([20, -77, -z_offset])
    rotate([0,0,18.5])
      latch_left();
    
    
    translate([96, 10, -z_offset])
    rotate([0,0,90])
      latch_left(); 
   
   translate([-25, 65, -z_offset])
    rotate([0,0,-175.5])
      latch_left(); 
    
    translate([-70.6, -20, -z_offset])
    rotate([0,0,-99])
      latch_left(); 
    
}

module latches_trimmed() {
    difference() {
      latches();
        outline_outer();
    }
}

module left_cover() {
    scale([1, 1, -1])
    cover_shell();
}

module build_shema() {
  translate([0, 0, -100]) {
    left_cover();
  }

  translate([0, 0, -50]) {
    latches_left();
    perimeter_left();
  }

  translate([0, 0, 50]) 
    cover_shell();

  latches();
  perimeter();
}

build_shema();
//outline_outer_cut();
//cover_shell();


//latch_left();

