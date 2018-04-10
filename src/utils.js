/**
 * Created by Jad_PC on 2018/4/11.
 */
export const eventOnElement = (event, className) => {
    for(let item of event.path){
        if(item.className && item.className.includes(className)){
            return item;
        }
    }
    return null;
};
