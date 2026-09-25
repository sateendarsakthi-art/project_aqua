import gymnasium as gym
from gymnasium import spaces
import numpy as np

class DataCenterEnv(gym.Env):
    def __init__(self):
        super().__init__()
        self.observation_space=spaces.Box(0,100,(7,),dtype=np.float32)
        self.action_space=spaces.Discrete(9)
    def reset(self,seed=None,options=None):
        super().reset(seed=seed)
        self.state=np.array([60,70,25,70,55,30,60],dtype=np.float32)
        return self.state,{}
    def step(self,action):
        cpu,gpu,temp,power,water,outside,workload=self.state
        effects=[(-5,-8,0),(-3,-5,.4),(-6,-10,0),(3,-2,-.5),(-4,0,0),(4,0,0),(-2,-12,0),(-2,-6,0),(1,0,0)]
        dp,dw,dt=effects[action]
        power+=dp;water+=dw;temp+=dt
        cpu=np.clip(cpu+np.random.uniform(-4,4),0,100);gpu=np.clip(gpu+np.random.uniform(-4,4),0,100)
        workload=np.clip(workload+np.random.uniform(-3,3),0,100)
        temp=np.clip(temp+.02*(cpu+gpu)/2-.05,15,45);power=np.clip(power+np.random.uniform(-2,2),20,160)
        water=np.clip(water+np.random.uniform(-3,3),10,150)
        self.state=np.array([cpu,gpu,temp,power,water,outside,workload],dtype=np.float32)
        reward=-(power*.7+water*.5+max(0,temp-32)*10+max(0,50-workload)*.8)
        return self.state,reward,False,False,{}
