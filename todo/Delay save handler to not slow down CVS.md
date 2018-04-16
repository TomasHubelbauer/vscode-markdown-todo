# Delay save handler to not slow down CVS

Just delay it so that the SCM provider can finish its I/O bound work before we start intefering.
