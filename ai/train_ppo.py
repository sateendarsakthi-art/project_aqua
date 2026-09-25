from stable_baselines3 import PPO
from environment import DataCenterEnv

env=DataCenterEnv()
model=PPO("MlpPolicy",env,verbose=1,learning_rate=3e-4,n_steps=1024,batch_size=64)
model.learn(total_timesteps=50000)
model.save("aquaopt_ppo")
print("Saved aquaopt_ppo.zip")
