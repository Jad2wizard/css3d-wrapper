/**
 * Created by Jad_PC on 2018/4/11.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import * as TWEEN from 'tween.js';
import math from 'mathjs';
import styles from './index.scss';
import {eventOnElement} from './utils';

class CSS3D extends React.Component{
    constructor(props){
        super(props);
        this.camera = null;
        this.cameraZ = -3000;
        this.zoomScale = 1.5; //鼠标滚轮事件放大缩小camera系数
        this.rotateScale = 0.005; //camera旋转系数
        this.cameraRotateX = 0; //camera 在 X 轴上的旋转角度
        this.cameraRotateY = 0; //camera 在 Y 轴上的旋转角度
        this.cameraRotateZ = 0; //camera 在 Z 轴上的旋转角度
        this.cards = []; //卡片数组，用于存放卡片的 dom 元素以及卡片的 matrix3d 数组
        this.dragCard = null; //当前正在被拖拽的卡片
        this.focusCard = null; //当前点击的卡片
        this.enableClick = true; //点击鼠标左键后标识是拖拽事件还是点击事件
        this.pause = false;
        window.cards = this.cards;
        window.c = this;

        //从three.js camera new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 10000); projectMatrix.elements[5]获取
        this.cameraMatrix3d = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, window.innerWidth/2, window.innerHeight/2, this.cameraZ, 1];
        this.state = {
            perspective: 2.7474774194546225 * window.innerHeight / 2
        };
    }

    componentDidMount(){
        const camera = this.camera;
        //根据 CSS3D 组件的父组件宽度和高度调整 camera 位置
        const width = camera.parentNode.parentNode.clientWidth;
        const height = camera.parentNode.parentNode.clientHeight;
        this.state.perspective *= (height / window.innerHeight);
        this.cameraMatrix3d[12] = width / 2;
        this.cameraMatrix3d[13] = height / 2;
        this.setState({
            perspective: this.state.perspective
        });

        //获取 camera 元素下的子组件，并进行初始化
        this.initCard(Array.from(camera.children));

        //禁止鼠标右键点击显示菜单事件
        document.oncontextmenu = () => false;
        //设置 camera 元素的平移和缩放事件
        document.body.addEventListener('mousedown', this.mousedown, false);
        document.body.addEventListener('wheel', this.mousewheel, false);

        this.transform('grid');

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
        this.transform('grid');
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
            //设置translate(-50%, -50%)是为了让卡片的初始位置位于屏幕正中间
            item.matrix3d = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
            item.rotateX = 0;
            item.rotateY = 0;
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
    transform = (layoutMode, duration = 1000) => {
        if(layoutMode){
            TWEEN.removeAll();
            this.cards.forEach(card => {
                if(this.focusCard == card){
                    new TWEEN.Tween(card.matrix3d).to([1,0,0,0,0,1,0,0,0,0,1,0,0,0,-this.cameraZ/3,1]).easing(TWEEN.Easing.Exponential.InOut).start();
                    this.focusCard = null;
                }else{
                    let m = card.matrix3d;
                    let t = card[layoutMode] || null;
                    if(t){
                        new TWEEN.Tween(card.matrix3d)
                            .to([m[0],m[1],m[2],m[3],
                                m[4],m[5],m[6],m[7],
                                m[8],m[9],m[10],m[11],
                                t.x,t.y,t.z,m[15]], duration)
                            .easing(TWEEN.Easing.Exponential.InOut)
                            .start();
                    }
                }
            });
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
            let cameraStyle = this.camera.style;
            cameraStyle.transform = cameraStyle.transform.split('matrix3d')[0] + `matrix3d(${this.cameraMatrix3d.join(',')})`;
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
        if(event.button === 2) {
            document.body.addEventListener('mousemove', this.rightMousemove, false);
        }else if(event.button === 0){
            let target= eventOnElement(event, styles.card);
            if(target){
                event.stopPropagation();
                this.dragCard = this.cards.filter(c => c.domElement === target)[0] || null;
                document.body.addEventListener('mousemove', this.leftMousemove, false);
            }
        }else if(event.button === 1){
            document.body.addEventListener('mousemove', this.middleMousemove, false);
        }
        document.body.addEventListener('mouseup', this.mouseup, false);
    };

    /**
     * 鼠标滚轮拖拽时，camera 围绕 X轴和 Y轴旋转
     * @param {*} event
     */
    middleMousemove = (event) => {
        const {movementX, movementY} = event;
        this.cameraRotateX -= movementY * this.rotateScale;
        this.cameraRotateY += movementX * this.rotateScale;
        this.cards.forEach(card => {
            card.rotateX = -this.cameraRotateX;
            card.rotateY = -this.cameraRotateY;
        });
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
    leftMousemove = (event) => {
        const {dragCard} = this;
        event.preventDefault();
        if(dragCard){
            const {movementX, movementY} = event;
            this.enableClick = false;
            const scale = Math.abs((dragCard.matrix3d[14] + this.cameraMatrix3d[14]) / this.state.perspective);
            console.log('drag: ', dragCard.matrix3d[14]);
            console.log('camera: ', this.cameraMatrix3d[14]);
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
        if(event.button == 2) {
            setTimeout(()=>{this.enableClick = true;}, 500);
            if(this.enableClick) this.clickHandle(event);
            document.body.removeEventListener('mousemove', this.rightMousemove);
        }else if(event.button === 0){
            const {dragCard} = this;
            document.body.removeEventListener('mousemove', this.leftMousemove);
            if(dragCard) {
                dragCard.domElement.style.zIndex = 0;
                this.dragCard = null;
            }
        }else if(event.button === 1){
            document.body.removeEventListener('mousemove', this.middleMousemove);
        }
    };

    /**
     * 右键点击回调函数，右键点击某卡片后该卡片放大，其它卡片使用 overlap 布局
     * @param {*} event
     */
    clickHandle = (event) => {
        if(!this.enableClick || event.button !== 2) return;
        let target = eventOnElement(event, styles.card);
        if(target){
            this.focusCard = this.cards.filter(c => c.domElement == target)[0] || null;
            this.transform('overlap');
        }
    };

    render(){
        const {cameraMatrix3d,} = this;
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
                    {this.props.children}
                </div>
                <div className={styles.menu}>
                    <button id='overlap' onClick={() => {this.transform('overlap');}}>OVERLAP</button>
                    <button id='grid' onClick={() => {this.transform('grid');}}>GRID</button>
                </div>
            </div>
        );
    }
}

/**
 * demo of CSS3D
 */
class Demo extends React.Component{
    constructor(props){
        super(props);
        this.cardWidth = 600;
        this.cardHeight = 420;
        this.state = {cards: [
            {title: '张三'},
            {title: '张三'},
            {title: '张三'},
            {title: '张三'},
            {title: '张三'},
            {title: '张三'},
            {title: '张三'},
            {title: '张三'},
            {title: '张三'}
        ]};
    }

    componentDidMount(){
        const nextCards = this.state.cards.concat([
            {title: '张一'},
            {title: '张二'},
            {title: '张三'},
            {title: '张四'},
            {title: '张五'}
        ]);
        setTimeout(() => {
            this.setState({
                cards: nextCards
            });
        }, 1500);
    }

    render(){
        return (
            <div style={{position: 'absolute', width: '100%', height: '100%'}}>
                <CSS3D>
                    {this.state.cards.map((item, index) => (
                        <div key={index} className={styles.card} style={{width: this.cardWidth, height: this.cardHeight,}}>
                            <div className={styles.cardHeader}>
                                <input type="checkbox" className={styles.checkbox} />
                                {item.title}
                            </div>
                            <div className={styles.cardContent}></div>
                        </div>)
                    )}
                </CSS3D>
            </div>
        );
    }
}

ReactDOM.render(
    <Demo/>,
    document.getElementById('main')
);

export default CSS3D;
