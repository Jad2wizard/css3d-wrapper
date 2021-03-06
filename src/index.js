/**
 * Created by Jad_PC on 2018/4/11.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import * as TWEEN from 'tween.js';
import math from 'mathjs';
import styles from './index.scss';
import {eventOnElement} from './utils';

const cards = [
    {title: '张一'},
    {title: '张二'},
    {title: '张三'},
    {title: '张四'},
    {title: '张五'},
    {title: '张六'},
    {title: '张七'},
    {title: '张八'},
    {title: '张九'},
    {title: '张十'},
    {title: '张十一'},
    {title: '张十二'},
    {title: '张十三'},
    {title: '张十四'},
    {title: '张十五'}
];

export class Css3dWrapper extends React.Component{
    constructor(props){
        super(props);
        this.camera = null;
        this.cameraZ = -3000;
        this.zoomScale = 1.5; //鼠标滚轮事件放大缩小camera系数
        this.rotateScale = 0.005; //camera旋转系数
        this.cameraRotateX = 0; //camera 在 X 轴上的旋转角度
        this.cameraRotateY = 0; //camera 在 Y 轴上的旋转角度
        this.cameraRotateZ = 0; //camera 在 Z 轴上的旋转角度

        this.enableClick = true; //点击鼠标左键后标识是拖拽事件还是点击事件
        this.pause = false;
        window.cards = this.cards;
        window.c = this;

        this.containerWidth = window.innerWidth;
        this.containerHeight = window.innerHeight;
        this.cards = []; //卡片数组，用于存放卡片的 dom 元素以及卡片的 matrix3d 数组
        this.dragCard = null; //当前正在被拖拽的卡片
        this.focusCard = null; //当前点击的卡片
        //点击放大卡片的真实变换矩阵 = card.matrix3d * cameraMatrix3d, 设置为显示点击卡片位置变换到容器正中央。需要配合 cameraMatrix3d 计算出 card.matrix3d
        this.focusMatrix3d = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, this.containerWidth/2, this.containerHeight/2, -2000, 1];

        //从three.js camera new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 10000); projectMatrix.elements[5]获取
        this.cameraMatrix3d = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, this.containerWidth/2, this.containerHeight/2, this.cameraZ, 1];
        this.state = {
            perspective: 2.7474774194546225 * this.containerHeight / 2
        };
    }

    componentDidMount(){
        const camera = this.camera;
        //根据 CSS3D 组件的父组件宽度和高度调整 camera 位置
        this.containerWidth = camera.parentNode.parentNode.clientWidth;
        this.containerHeight = camera.parentNode.parentNode.clientHeight;
        this.cameraMatrix3d[12] = this.containerWidth / 2;
        this.cameraMatrix3d[13] = this.containerHeight / 2;
        this.setState({
            perspective: 2.7474774194546225 * this.containerHeight / 2
        });

        //获取 camera 元素下的子组件，并进行初始化
        this.initCard(Array.from(camera.children));

        //禁止鼠标右键点击显示菜单事件
        document.oncontextmenu = () => false;
        //设置 camera 元素的平移和缩放事件
        document.body.addEventListener('mousedown', this.mousedown, false);
        document.body.addEventListener('wheel', this.mousewheel, false);

        this.tweenTransform('grid');

        //每帧动画函数
        this.animate();
    }

    componentDidUpdate(){
        let currentCardDomList = Array.from(this.camera.children);
        let removeCards = []; //此次更新后需要从 cards 中删除的 card
        let addCards = []; //此次更新后需要添加到 cards 中的 card 的 dom 节点
        this.cards.forEach(card => {
            if(currentCardDomList.filter(dom => dom === card.domElement).length === 0) removeCards.push(card);
        });
        removeCards.forEach(card => {
            this.cards.splice(this.cards.indexOf(card), 1);
        });
        currentCardDomList.forEach(dom => {
            if(this.cards.filter(card => card.domElement === dom).length === 0) addCards.push(dom);
        });
        this.initCard(addCards);
        this.tweenTransform('grid');
    }

    /**
     * 对 CSS3D 组件已经渲染出来的子组件进行 transform 的初始化，并将子组件 dom 添加到 this.cards 数组
     * @param {Array} domList | 需要进行初始化的子组件 dom lis
     */
    initCard = (domList) => {
        let newCards = []; //存放新添加的 card
        let prevCardsLen = this.cards.length;
        domList.forEach(dom => {
            let tmp = {domElement: dom};
            this.cards.push(tmp);
            newCards.push(tmp);
        });

        //对新添加的 card 的 transform 属性进行初始化
        newCards.forEach((item, index) => {
            let i = index + prevCardsLen;
            //设置translate(-50%, -50%)是为了让卡片的初始位置位于容器正中间
            item.matrix3d = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
            item.lastMatrix3d = null; //记录点击放大的卡片放大前的真实变化矩阵 = matrix3d * cameraMatrix3d
            item.domElement.style.transform = `translate(-50%,-50%) matrix3d(${item.matrix3d.join(',')})`;
            item.grid = {
                x: (i % 3) * 700 - 700,
                y: (Math.floor(i / 3) % 3) * 600 - 600,
                z: -Math.floor(i / 3 / 3) * 600
            };
            item.overlap = {
                x: -1200 + i*40,
                y: -800 + i*40,
                z: 0
            };
        });
    };

    translateCam = ({x = 0, y = 0, z = 0}) => {
        const nextCameraMatrix3d = this.cameraMatrix3d.slice();
        nextCameraMatrix3d[12] += x;
        nextCameraMatrix3d[13] += y;
        nextCameraMatrix3d[14] += z;
        this.cameraMatrix3d =  nextCameraMatrix3d;
    };

    /**
     * TWEEN.js 动画函数
     * @param {string} layoutMode | 卡片布局模式
     * @param {number} duration | tween.js 动画持续时长
     */
    tweenTransform = (layoutMode, duration = 1500) => {
        if(layoutMode) {
            TWEEN.removeAll();
            if (layoutMode === 'focus') {
                this.cards.forEach(card => {
                    const {focusMatrix3d, cameraMatrix3d} = this;
                    let camMat = [cameraMatrix3d.slice(0, 4), cameraMatrix3d.slice(4, 8), cameraMatrix3d.slice(8, 12), cameraMatrix3d.slice(12, 16)];
                    let cardMat = [card.matrix3d.slice(0,4),card.matrix3d.slice(4,8),card.matrix3d.slice(8,12),card.matrix3d.slice(12,16)]
                    if(card === this.focusCard){
                        card.lastMatrix3d = math.chain(cardMat).multiply(camMat).valueOf().reduce((a,b) => a.concat(b));
                        //被点击选中的子组件的最终变换矩阵为固定的 focusMatrix3d。因为 focusMatrix3d = cardMatrix3d * cameraMatrix3d
                        //故被点击选中子组件的变换矩阵 cardMatrix3d = focusMatrix3d * cameraReverseMatrix3
                        let matrix3d = math.chain([focusMatrix3d.slice(0, 4),
                            focusMatrix3d.slice(4, 8),
                            focusMatrix3d.slice(8, 12),
                            focusMatrix3d.slice(12, 16)])
                            .multiply(math.divide(math.eye(4), math.matrix(camMat)).valueOf())
                            .valueOf().reduce((a, b) => a.concat(b));
                        new TWEEN.Tween(card.matrix3d).to(matrix3d).easing(TWEEN.Easing.Exponential.InOut).start();
                    } else {
                        if (card.lastMatrix3d) {
                            let lm = card.lastMatrix3d;
                            lm = [lm.slice(0,4), lm.slice(4,8), lm.slice(8,12), lm.slice(12,16)];
                            lm = math.divide(math.matrix(lm), math.matrix(camMat)).valueOf().reduce((a, b) => a.concat(b));
                            new TWEEN.Tween(card.matrix3d).to(lm).easing(TWEEN.Easing.Exponential.InOut).start();
                            card.lastMatrix3d = null;
                        } else {
                            let m = card.matrix3d;
                            let originMatrix = math.chain([m.slice(0, 4), m.slice(4, 8), m.slice(8, 12), m.slice(12, 16)])
                                .multiply(camMat).valueOf();
                            if (originMatrix[3][2] > focusMatrix3d[14]) {
                                originMatrix[3][2] += focusMatrix3d[14];
                                let newCardMatrix = math.divide(math.matrix(originMatrix), math.matrix(camMat)).valueOf().reduce((a, b) => a.concat(b));
                                new TWEEN.Tween(card.matrix3d).to(newCardMatrix).easing(TWEEN.Easing.Exponential.InOut).start();
                            }
                        }
                    }
                });
            } else {
                this.cards.forEach(card => {
                    let t = card[layoutMode] || null;
                    if (t) {
                        new TWEEN.Tween(card.matrix3d)
                            .to([1, 0, 0, 0,
                                0, 1, 0, 0,
                                0, 0, 1, 0,
                                t.x, t.y, t.z, 1], duration)
                            .easing(TWEEN.Easing.Exponential.InOut)
                            .start();
                    }
                });
                //当用户点击布局按钮后，camera 变换矩阵初始化
                new TWEEN.Tween(this.cameraMatrix3d)
                    .to([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, window.innerWidth/2, window.innerHeight/2, this.cameraZ, 1], duration)
                    .easing(TWEEN.Easing.Exponential.InOut)
                    .start();
                this.cameraRotateX = 0;
                this.cameraRotateY = 0;
            }
        }
    };

    /**
     * 帧动画函数，用户更新 tween.js 动画，卡片的 matrix3d 以及 camera 的位置
     */
    animate = () => {
        if(!this.pause) {
            //更新 TWEEN
            TWEEN.update();
            //更新卡片transform。遍历所有卡片，将卡片 style.transform中的 matrix3d 设置为 card.matrix3d
            this.cards.forEach(item => {
                const transforms = item.domElement.style.transform.split('matrix3d');
                if (transforms[1]) {
                    transforms[1] = `(${item.matrix3d.join(',')})`;
                }
                item.domElement.style.transform = transforms.join('matrix3d');
            });
            if (this.dragCard) {
                this.dragCard.domElement.style.zIndex = 9999;
            }
            //更新 camera 的 transform
            if(this.camera) {
                let cameraStyle = this.camera.style;
                cameraStyle.transform = cameraStyle.transform.split('matrix3d')[0] + `matrix3d(${this.cameraMatrix3d.join(',')})`;
            }
        }

        window.requestAnimationFrame(this.animate);
    };

    /**
     * 鼠标滚轮事件回调函数
     * @param {Object} event
     */
    mousewheel = (event) => {
        if(event.deltaMode === 0){
            this.translateCam({z: -1 * event.deltaY * this.zoomScale});
        }
    };

    /**
     * mousedown 事件回调函数，左键点击用于设置卡片的拖拽效果。右键点击用于放大被点击的卡片以及设置 camera 位移
     * @param {Object} event
     */
    mousedown = (event) => {
        let card = eventOnElement(event, styles.card);
        let className = event.target.className;
        event.preventDefault();
        event.stopPropagation();
        if(card){
            this.dragCard = this.cards.filter(c => c.domElement === card)[0] || null;
            document.body.addEventListener('mousemove', this.cardMoveHandle, false);
        } else if(className.includes(styles.container) || className.includes(styles.camera)){
            document.body.addEventListener('mousemove', this.rotateHandle, false);
        }
        document.body.addEventListener('mouseup', this.mouseup, false);
    };

    /**
     * 鼠标滚轮拖拽时，camera 围绕 X轴和 Y轴旋转
     * @param {*} event
     */
    rotateHandle = (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.enableClick = false;
        const {movementX, movementY} = event;
        this.cameraRotateX -= movementY * this.rotateScale;
        this.cameraRotateY += movementX * this.rotateScale;
        const a = this.cameraRotateX;
        const b = this.cameraRotateY;
        const sinA = Math.sin(a);
        const cosA = Math.cos(a);
        const sinB = Math.sin(b);
        const cosB = Math.cos(b);

        // camera 的旋转矩阵等于 rotateX(a) 对应的旋转矩阵乘以 rotateY(b) 对应的旋转矩阵
        const rotateXMatrix = math.eye(4).valueOf();
        rotateXMatrix[1][1] = cosA;
        rotateXMatrix[1][2] = sinA;
        rotateXMatrix[2][1] = -sinA;
        rotateXMatrix[2][2] = cosA;
        const rotateYMatrix = math.eye(4).valueOf();
        rotateYMatrix[0][0] = cosB;
        rotateYMatrix[0][2] = -sinB;
        rotateYMatrix[2][0] = sinB;
        rotateYMatrix[2][2] = cosB;
        const reverseRotateXMatrix = math.eye(4).valueOf();
        reverseRotateXMatrix[1][1] = cosA;
        reverseRotateXMatrix[1][2] = -sinA;
        reverseRotateXMatrix[2][1] = sinA;
        reverseRotateXMatrix[2][2] = cosA;
        const reverseRotateYMatrix = math.eye(4).valueOf();
        reverseRotateYMatrix[0][0] = cosB;
        reverseRotateYMatrix[0][2] = sinB;
        reverseRotateYMatrix[2][0] = -sinB;
        reverseRotateYMatrix[2][2] = cosB;

        this.cameraMatrix3d = math.chain(rotateXMatrix).multiply(rotateYMatrix)
            .multiply([[1,0,0,0], [0,1,0,0], [0,0,1,0], this.cameraMatrix3d.slice(12, 16)]).valueOf().reduce((a, b) => a.concat(b), []);

        this.cards.forEach(card => {
            //每张卡片为了保持法向量始终朝向屏幕，旋转矩阵应该等于 rotateY(-b) 对应的旋转矩阵乘以 rotateX(-a) 对应的旋转矩阵
            const matrix = card.matrix3d;
            card.matrix3d = math.chain(reverseRotateYMatrix).multiply(reverseRotateXMatrix)
                .multiply([[1,0,0,0], [0,1,0,0], [0,0,1,0], matrix.slice(12, 16)]).valueOf().reduce((a, b) => a.concat(b), []);
        });
    };

    /**
     * 鼠标右键拖拽事件回调，如果鼠标位移小于 3 像素，则判定为右键点击事件。反之则判定为右键拖拽
     * @param {*} event
     */
    rightMousemove = (event) => {
        const {movementX, movementY} = event;
        if(Math.abs(movementX) + Math.abs(movementY) < 3) return;
        const scale = Math.abs(this.cameraMatrix3d[14] / this.state.perspective);
        this.translateCam({x: movementX * scale, y: movementY * scale});
    };

    /**
     * 鼠标左键拖拽事件回电函数
     * @param {*} event
     */
    cardMoveHandle = (event) => {
        const {dragCard} = this;
        const {movementX, movementY} = event;
        if(Math.abs(movementX) + Math.abs(movementY) < 3) return;
        event.preventDefault();
        event.stopPropagation();
        if(dragCard){
            this.enableClick = false;
            const cardMat = dragCard.matrix3d;
            const camMat = this.cameraMatrix3d;
            const originMatrix = math.chain([cardMat.slice(0, 4), cardMat.slice(4, 8), cardMat.slice(8, 12), cardMat.slice(12, 16)] )
                .multiply([camMat.slice(0, 4), camMat.slice(4, 8), camMat.slice(8, 12), camMat.slice(12, 16)])
                .valueOf().reduce((a, b) => a.concat(b));
            const scale = Math.abs((originMatrix[14]) / this.state.perspective);
            const translateMatrix = math.eye(4).valueOf();
            const matrix = dragCard.matrix3d;
            translateMatrix[3][0] = movementX * scale;
            translateMatrix[3][1] = movementY * scale;
            dragCard.matrix3d = math.chain(translateMatrix)
                .multiply([matrix.slice(0, 4), matrix.slice(4, 8), matrix.slice(8, 12), matrix.slice(12, 16), ])
                .valueOf().reduce((a, b) => a.concat(b), []);
        }
    };

    /**
     * mouseup 事件回调，用于 remove 拖拽事件的监听，以及调用右键点击的回调函数
     * @param {Object} event
     */
    mouseup = (event) => {
        const {dragCard} = this;
        if(dragCard) {
            dragCard.domElement.style.zIndex = 0;
            this.dragCard = null;
        }
        if(this.enableClick) this.clickHandle(event);
        else this.enableClick = true;
        document.body.removeEventListener('mousemove', this.cardMoveHandle);
        document.body.removeEventListener('mousemove', this.rotateHandle);
    };

    /**
     * 右键点击回调函数，右键点击某卡片后该卡片放大，其它卡片使用 overlap 布局
     * @param {*} event
     */
    clickHandle = (event) => {
        if(!this.enableClick) return;
        let target = eventOnElement(event, styles.card);
        if(target){
            if(this.focusCard && this.focusCard.domElement === target){
                this.focusCard = null;
            } else {
                this.focusCard = this.cards.filter(c => c.domElement == target)[0] || null;
            }
            this.tweenTransform('focus', 750);
        }
    };

    render(){
        const children = this.props.children ||
            cards.map((item, index) => (
                <div key={index} className={styles.card} style={{width: 600, height: 420}}>
                    <div className={styles.cardHeader}>
                        <input type="checkbox" className={styles.checkbox} />
                        {item.title}
                    </div>
                    <div className={styles.cardContent} style={{backgroundColor: `rgb(${Math.random()*255|0}, ${Math.random()*255|0}, ${Math.random()*255|0})`}}></div>
                </div>
            ));
        const {cameraMatrix3d} = this;
        const {perspective} = this.state;
        return (
            <div
                className={styles.container}
                style={{perspective}}>
                <div
                    className={styles.camera}
                    style={{transformOrigin: 'left top',transform: `translateZ(${perspective}px) matrix3d(${cameraMatrix3d.join(',')})`}}
                    ref={e => {this.camera = e;}}
                >
                    {children}
                </div>
                <div className={styles.menu}>
                    <button id='overlap' onClick={() => {this.tweenTransform('overlap');}}>OVERLAP</button>
                    <button id='grid' onClick={() => {this.tweenTransform('grid');}}>GRID</button>
                </div>
            </div>
        );
    }
}

const container = document.getElementById('jad2wizard');
//如果 <div id='jad2wizard'></div> 存在，则说明当前是在 example.html 文件中引用
if(container) {
    container.style.width = window.innerWidth + 'px';
    container.style.height = window.innerHeight + 'px';
    ReactDOM.render(
        <Css3dWrapper/>,
        document.getElementById('jad2wizard')
    );
}
