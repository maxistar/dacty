use <connector_holder.scad>;

module connector_holder_mirror() {
    scale([-1,1,1]) {
        connector_holder();
    }
}

connector_holder_mirror();