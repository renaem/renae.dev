import { AfterViewInit, Component, ElementRef, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import * as THREE from 'three';
import anime from 'animejs/lib/anime.es.js';
import { Subject } from 'rxjs';

const TWO_PI = Math.PI * 2;
// Wrap to [-π, π]
const wrapPi = (a: number) => {
  a = (a + Math.PI) % TWO_PI;
  if (a < 0) a += TWO_PI;
  return a - Math.PI;
};

@Component({
    selector: 'app-nav-menu',
    templateUrl: './nav-menu.component.html',
    styleUrls: ['./nav-menu.component.scss'],
    standalone: false
})
export class NavMenuComponent implements OnInit, AfterViewInit {
  @ViewChild('navBackground', { static: false })
  private canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  private camera!: THREE.OrthographicCamera;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;

  private pillOne!: THREE.Mesh<THREE.CapsuleGeometry, THREE.Material>;
  pillOneHover = false;
  private pillTwo!: THREE.Mesh<THREE.CapsuleGeometry, THREE.Material>;
  pillTwoHover = false;
  private pillThree!: THREE.Mesh< THREE.CapsuleGeometry, THREE.Material>;
  pillThreeHover = false;

  private destroy$ = new Subject<void>();

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.createScene();
    this.startRenderingLoop();
  }

  private startRenderingLoop() {
    //* Renderer
    // Use canvas element in template
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(devicePixelRatio);
    //this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

    let component: NavMenuComponent = this;
    let totalRotation = 0;
    (function render() {
      const rotationSpeed = 0.0025;
      const rotationDelta = rotationSpeed * Math.PI / 2;

      if(!component.pillOneHover) {
        component.pillOne.rotation.x -= rotationDelta;
        component.pillOne.rotation.y -= rotationDelta;
      }
      if(!component.pillTwoHover) {
       component.pillTwo.rotation.y += rotationDelta;
      }
      // if(!component.pillThreeHover) {
      //   component.pillThree.rotation.x += rotationDelta;
      //   component.pillThree.rotation.y -= rotationDelta;
      // }

      // keep rotations bounded so they never blow up
      component.pillOne.rotation.x = wrapPi(component.pillOne.rotation.x);
      component.pillOne.rotation.y = wrapPi(component.pillOne.rotation.y);
      component.pillOne.rotation.z = wrapPi(component.pillOne.rotation.z);

      component.pillTwo.rotation.x = wrapPi(component.pillTwo.rotation.x);
      component.pillTwo.rotation.y = wrapPi(component.pillTwo.rotation.y);
      component.pillTwo.rotation.z = wrapPi(component.pillTwo.rotation.z);

      requestAnimationFrame(render);
      component.renderer.render(component.scene, component.camera);
    }());
  }

  private getAspectRatio() {
    return this.canvas?.clientWidth / this.canvas?.clientHeight;
  }

  private createScene() {
    //* Scene
    this.scene = new THREE.Scene();

    //* Camera
    let aspectRatio = this.getAspectRatio();
    this.camera = new THREE.OrthographicCamera( -3 * aspectRatio, 3 * aspectRatio, 3, -3, 1, 1000 );
    this.camera.position.z = 5;

    const directionLight: THREE.DirectionalLight = new THREE.DirectionalLight( 0x34A4E8, 1);
    directionLight.position.set( 0, 5, 5 );
    this.scene.add( directionLight );

    const ambientLight: THREE.AmbientLight = new THREE.AmbientLight( 0xFFFFFF, 1);
    this.scene.add( ambientLight );

    // Create Gradient Pills
    // https://stackoverflow.com/questions/64560154/applying-color-gradient-to-material-by-extending-three-js-material-class-with-on
    const pillGeometry = new THREE.CapsuleGeometry( 1, 2.5, 4, 12);
    pillGeometry.computeBoundingBox();
    let uniforms = {
      bbMin: {value: pillGeometry.boundingBox.min},
      bbMax: {value: pillGeometry.boundingBox.max},
      color1: {value: new THREE.Color(0x7F47DD)},
      color2: {value: new THREE.Color(0xF857A6)}
    }
    const gradientMaterial = new THREE.MeshStandardMaterial({
      roughness: 1,
      metalness: 0,
      onBeforeCompile: shader => {
        shader.uniforms.bbMin = uniforms.bbMin;
        shader.uniforms.bbMax = uniforms.bbMax;
        shader.uniforms.color1 = uniforms.color1;
        shader.uniforms.color2 = uniforms.color2;
        shader.vertexShader = `
            varying vec3 vPos;
          ${shader.vertexShader}
        `.replace(
        `#include <begin_vertex>`,
        `#include <begin_vertex>
        vPos = transformed;
        `
        );
        shader.fragmentShader = `
            uniform vec3 bbMin;
          uniform vec3 bbMax;
          uniform vec3 color1;
          uniform vec3 color2;
          varying vec3 vPos;
          ${shader.fragmentShader}
        `.replace(
            `vec4 diffuseColor = vec4( diffuse, opacity );`,
          `
          float f = clamp((vPos.z - bbMin.z) / (bbMax.z - bbMin.z), 0., 1.);
          vec3 col = mix(color1, color2, f);
          vec4 diffuseColor = vec4( col, opacity );`
        );
      }
  });

    //* Pill/Nav Link 1
    this.pillOne = new THREE.Mesh(pillGeometry, gradientMaterial);
    // this.pillOne.position.x = -7.7;
    this.pillOne.position.x = -3.35;
    this.pillOne.rotation.x = Math.PI / 2;
    this.pillOne.rotation.z = Math.PI / 2;
    this.scene.add(this.pillOne);

    //* Pill/Nav Link 2
    this.pillTwo = new THREE.Mesh(pillGeometry, gradientMaterial);
    // this.pillTwo.position.x = 0.3;
    this.pillTwo.position.x = 5.2;
    this.pillTwo.rotation.x = Math.PI / 2;
    this.pillTwo.rotation.z = Math.PI / 2;
    this.scene.add(this.pillTwo);

    //* Pill/Nav Link 3
    // this.pillThree = new THREE.Mesh(pillGeometry,gradientMaterial);
    // this.pillThree.position.x = 8.9;
    // this.pillThree.rotation.x = Math.PI / 2;
    // this.pillThree.rotation.z = Math.PI / 2;
    // this.scene.add(this.pillThree);
  }

  private snapToHalfTurn(angle: number, offset = Math.PI / 2): number {
    // nearest multiple of 180° from offset, without modulo wrapping
    const half = Math.PI;
    const n = Math.round((angle - offset) / half);
    return offset + n * half;
  }

  private unwrapTo(start: number, end: number): number {
    // choose end equivalent that moves <= 180° from start
    const TWO_PI = Math.PI * 2;
    let e = end;
    while (e - start >  Math.PI) e -= TWO_PI;
    while (e - start < -Math.PI) e += TWO_PI;
    return e;
  }

  linkHover(linkId: number, event: MouseEvent) {
    if(linkId === 1) {
      const tx = this.snapToHalfTurn(this.pillOne.rotation.x, Math.PI / 2);
      const tz = this.snapToHalfTurn(this.pillOne.rotation.z, Math.PI / 2);
      const ux = this.unwrapTo(this.pillOne.rotation.x, tx);
      const uz = this.unwrapTo(this.pillOne.rotation.z, tz);

      this.pillOneHover = true;

      // Remove any existing animations to prevent conflicts
      anime.remove(this.pillOne.scale);
      anime.remove(this.pillOne.rotation);

      anime({
        targets: [this.pillOne.scale],
        x: 1.4, y: 1.4, z: 1.4,
        easing: "cubicBezier(0,1.49,0.5,1)",
        duration: 300,
        loop: false
      });
      anime({
        targets: [this.pillOne.rotation],
        x: ux,
        z: uz,
        y: 0,
        easing: "easeOutQuad",
        duration: 500,
        loop: false
      });
    }
    if(linkId === 2) {
      const tx = this.snapToHalfTurn(this.pillTwo.rotation.x, Math.PI / 2);
      const tz = this.snapToHalfTurn(this.pillTwo.rotation.z, Math.PI / 2);
      const ux = this.unwrapTo(this.pillTwo.rotation.x, tx);
      const uz = this.unwrapTo(this.pillTwo.rotation.z, tz);

      // Remove any existing animations to prevent conflicts
      anime.remove(this.pillTwo.scale);
      anime.remove(this.pillTwo.rotation);

      this.pillTwoHover = true;
      
      anime({
        targets: [this.pillTwo.scale],
        x: 1.4, y: 1.4, z: 1.4,
        easing: "cubicBezier(0,1.49,0.5,1)",
        duration: 300,
        loop: false
      });
      anime({
        targets: [this.pillTwo.rotation],
        x: ux,
        z: uz,
        y: 0,
        easing: "easeOutQuad",
        duration: 500,
        loop: false
      });
    }
    // if(linkId === 3) {
    //   this.pillThreeHover = true;
    //   anime({
    //     targets: [this.pillThree.scale],
    //     x: 1.4, y: 1.4, z: 1.4,
    //     easing: "cubicBezier(0,1.49,0.5,1)",
    //     duration: 300,
    //     loop: false
    //   });
    //   anime({
    //     targets: [this.pillThree.rotation],
    //     x: Math.PI / 2, y: 0, z: Math.PI / 2,
    //     easing: "easeOutQuad",
    //     duration: 500,
    //     loop: false
    //   });
    // }
  }

  linkEndHover(linkId: number, event: MouseEvent) {
    if(linkId === 1) {
      this.pillOneHover = false;
      anime({
        targets: [this.pillOne.scale],
        x: 1, y: 1, z: 1,
        easing: "easeOutQuad",
        duration: 300,
        loop: false
      });
    }
    if(linkId === 2) {
      this.pillTwoHover = false;
      anime({
        targets: [this.pillTwo.scale],
        x: 1, y: 1, z: 1,
        easing: "easeOutQuad",
        duration: 300,
        loop: false
      });
    }
    if(linkId === 3) {
      this.pillThreeHover = false;
      anime({
        targets: [this.pillThree.scale],
        x: 1, y: 1, z: 1,
        easing: "easeOutQuad",
        duration: 300,
        loop: false
      });
    }
  }
}
